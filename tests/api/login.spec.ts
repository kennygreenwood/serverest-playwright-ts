import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

// Formato dos dados enviados e recebidos, conforme a documentação do ServeRest
interface Usuario {
  nome: string;
  email: string;
  password: string;
  administrador: 'true' | 'false';
}

interface RespostaCadastro {
  message: string;
  _id: string;
}

interface RespostaLogin {
  message: string;
  authorization?: string;
}

// Tipos do CT04 (Esquema do Cenário): cada linha da tabela "Exemplos" vira um teste
type CampoLogin = 'email' | 'password';
type SituacaoCampo = 'ausente' | 'vazio';

interface ExemploCampoObrigatorio {
  campo: CampoLogin;
  situacao: SituacaoCampo;
  mensagem: string;
}

// Em erro de validação (400), o ServeRest responde com o nome do campo como chave
type RespostaValidacao = Partial<Record<CampoLogin, string>>;

// Tabela "Exemplos" do login.feature, copiada linha a linha
const exemplosCampoObrigatorio: ExemploCampoObrigatorio[] = [
  { campo: 'email', situacao: 'ausente', mensagem: 'email é obrigatório' },
  { campo: 'password', situacao: 'ausente', mensagem: 'password é obrigatório' },
  { campo: 'email', situacao: 'vazio', mensagem: 'email não pode ficar em branco' },
  { campo: 'password', situacao: 'vazio', mensagem: 'password não pode ficar em branco' },
];

test.describe('POST /login', () => {
  let usuario: Usuario;
  let idUsuario: string | undefined;

  // Contexto do .feature: "Dado que existe um usuário cadastrado"
  // Cada teste cria o próprio usuário, porque o ServeRest é compartilhado por todos
  test.beforeEach(async ({ request }) => {
    usuario = {
      nome: 'Usuário de Teste',
      email: `qa-${randomUUID()}@teste.com`,
      password: 'senha123',
      administrador: 'false',
    };

    const resposta = await request.post('/usuarios', { data: usuario });

    expect(resposta.status()).toBe(201);
    const corpo: RespostaCadastro = await resposta.json();
    idUsuario = corpo._id;
  });

  // Limpeza: apaga o usuário criado para não deixar lixo no ambiente compartilhado
  test.afterEach(async ({ request }) => {
    if (idUsuario === undefined) {
      return;
    }

    const resposta = await request.delete(`/usuarios/${idUsuario}`);

    expect(resposta.status()).toBe(200);
    idUsuario = undefined;
  });

  test(
    'CT01 - login com credenciais válidas',
    { tag: ['@CT01', '@positivo'] },
    async ({ request }) => {
      // Quando envio POST /login com o e-mail e a senha do usuário
      const resposta = await request.post('/login', {
        data: { email: usuario.email, password: usuario.password },
      });

      // Então o status da resposta é 200
      expect(resposta.status()).toBe(200);

      // E a mensagem é "Login realizado com sucesso"
      const corpo: RespostaLogin = await resposta.json();
      expect(corpo.message).toBe('Login realizado com sucesso');

      // E o campo "authorization" contém um token no formato "Bearer <token>"
      expect(corpo.authorization).toMatch(/^Bearer \S+$/);
    },
  );

  test(
    'CT02 - login com senha errada',
    { tag: ['@CT02', '@negativo'] },
    async ({ request }) => {
      // Quando envio POST /login com o e-mail do usuário e uma senha errada
      // A senha errada deriva da certa, assim o teste nunca usa a senha válida por engano
      const resposta = await request.post('/login', {
        data: { email: usuario.email, password: `${usuario.password}-errada` },
      });

      // Então o status da resposta é 401
      expect(resposta.status()).toBe(401);

      // E a mensagem é "Email e/ou senha inválidos"
      const corpo: RespostaLogin = await resposta.json();
      expect(corpo.message).toBe('Email e/ou senha inválidos');

      // E a resposta não contém o campo "authorization"
      // Checa a ausência da chave, não só do valor: um "authorization": "" também reprovaria
      expect(corpo).not.toHaveProperty('authorization');
    },
  );

  test(
    'CT03 - login com e-mail inexistente não revela se o e-mail está cadastrado',
    { tag: ['@CT03', '@negativo', '@seguranca'] },
    async ({ request }) => {
      // Quando envio POST /login com um e-mail que não está cadastrado
      // E-mail novo e aleatório, nunca cadastrado; a senha é a válida do usuário,
      // para que a única coisa errada na requisição seja o e-mail
      const emailInexistente = `qa-${randomUUID()}@teste.com`;
      const resposta = await request.post('/login', {
        data: { email: emailInexistente, password: usuario.password },
      });

      // Então o status da resposta é 401
      expect(resposta.status()).toBe(401);

      // E a mensagem é "Email e/ou senha inválidos"
      const corpo: RespostaLogin = await resposta.json();
      expect(corpo.message).toBe('Email e/ou senha inválidos');

      // E a resposta é idêntica à de um login com senha errada
      // Se as duas respostas diferissem, um atacante descobriria quais e-mails estão cadastrados
      const respostaSenhaErrada = await request.post('/login', {
        data: { email: usuario.email, password: `${usuario.password}-errada` },
      });
      const corpoSenhaErrada: RespostaLogin = await respostaSenhaErrada.json();

      expect(resposta.status()).toBe(respostaSenhaErrada.status());
      expect(corpo).toEqual(corpoSenhaErrada);
    },
  );

  // Um teste para cada linha da tabela; o nome inclui campo e situação para
  // que o relatório mostre exatamente qual linha falhou
  for (const { campo, situacao, mensagem } of exemplosCampoObrigatorio) {
    test(
      `CT04 - login com campo "${campo}" ${situacao}`,
      { tag: ['@CT04', '@negativo', '@validacao'] },
      async ({ request }) => {
        // Quando envio POST /login com o campo "<campo>" <situacao>
        // Parte de um corpo válido e estraga só um campo, para isolar a causa do erro
        const corpoRequisicao: Partial<Record<CampoLogin, string>> = {
          email: usuario.email,
          password: usuario.password,
        };
        if (situacao === 'ausente') {
          delete corpoRequisicao[campo];
        } else {
          corpoRequisicao[campo] = '';
        }

        const resposta = await request.post('/login', { data: corpoRequisicao });

        // Então o status da resposta é 400
        expect(resposta.status()).toBe(400);

        // E o campo "<campo>" da resposta traz a mensagem "<mensagem>"
        const corpo: RespostaValidacao = await resposta.json();
        expect(corpo[campo]).toBe(mensagem);
      },
    );
  }
});
