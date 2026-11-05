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
});
