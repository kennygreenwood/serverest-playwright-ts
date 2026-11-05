# language: pt

Funcionalidade: Login na API do ServeRest
  Como usuário cadastrado no ServeRest
  Quero me autenticar com e-mail e senha
  Para receber um token e acessar as rotas protegidas

  Contexto:
    Dado que existe um usuário cadastrado com e-mail e senha válidos

  @CT01 @positivo
  Cenário: Login com credenciais válidas
    Quando envio POST /login com o e-mail e a senha do usuário
    Então o status da resposta é 200
    E a mensagem é "Login realizado com sucesso"
    E o campo "authorization" contém um token no formato "Bearer <token>"

  @CT02 @negativo
  Cenário: Login com senha errada
    Quando envio POST /login com o e-mail do usuário e uma senha errada
    Então o status da resposta é 401
    E a mensagem é "Email e/ou senha inválidos"
    E a resposta não contém o campo "authorization"

  @CT03 @negativo @seguranca
  Cenário: Login com e-mail inexistente não revela se o e-mail está cadastrado
    Quando envio POST /login com um e-mail que não está cadastrado
    Então o status da resposta é 401
    E a mensagem é "Email e/ou senha inválidos"
    E a resposta é idêntica à de um login com senha errada

  @CT04 @negativo @validacao
  Esquema do Cenário: Login com campo obrigatório ausente ou vazio
    Quando envio POST /login com o campo "<campo>" <situacao>
    Então o status da resposta é 400
    E o campo "<campo>" da resposta traz a mensagem "<mensagem>"

    Exemplos:
      | campo    | situacao | mensagem                          |
      | email    | ausente  | email é obrigatório               |
      | password | ausente  | password é obrigatório            |
      | email    | vazio    | email não pode ficar em branco    |
      | password | vazio    | password não pode ficar em branco |

  @CT05 @negativo @validacao
  Cenário: Login com e-mail em formato inválido
    Quando envio POST /login com o e-mail "semarroba"
    Então o status da resposta é 400
    E o campo "email" da resposta traz a mensagem "email deve ser um email válido"
