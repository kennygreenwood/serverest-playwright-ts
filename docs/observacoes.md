# Observações da análise exploratória

Comportamentos encontrados ao explorar a API do ServeRest (versão 3.2.2 da documentação) antes de automatizar os testes. Cada item informa a data em que foi observado e o que fazer com ele.

## Login (`POST /login`)

### OBS01: resposta 400 não documentada

- **Observado em:** 05/11/2026
- **Tipo:** divergência entre a documentação e o comportamento
- **Esperado pela documentação:** o Swagger lista apenas as respostas `200` (sucesso) e `401` (e-mail e/ou senha inválidos).
- **Comportamento real:** a API também responde `400` quando falta um campo, quando um campo está vazio ou quando o e-mail tem formato inválido. Nesses casos, o corpo traz o nome do campo e a mensagem, por exemplo `{"password": "password é obrigatório"}`.
- **Encaminhamento:** coberto pelos cenários CT04 e CT05. A sugestão é incluir a resposta `400` na documentação.

### OBS02: e-mail diferencia maiúsculas de minúsculas

- **Observado em:** 05/11/2026
- **Tipo:** dúvida de regra de negócio (não é classificado como defeito)
- **Comportamento:** o login com o e-mail cadastrado, mas escrito em maiúsculas, retorna `401`.
- **Risco:** um usuário que digita o e-mail com letra maiúscula, como costuma acontecer no celular, não consegue entrar e não entende o motivo.
- **Encaminhamento:** confirmar com o time de negócio se isso é intencional. Não foi automatizado até haver uma definição.

### OBS03: mesma mensagem para senha errada e e-mail inexistente (ponto positivo)

- **Observado em:** 05/11/2026
- **Tipo:** boa prática de segurança
- **Comportamento:** os dois casos retornam `401` com a mensagem `Email e/ou senha inválidos`, sem revelar se o e-mail está cadastrado. Isso evita a enumeração de usuários.
- **Encaminhamento:** protegido pelo cenário CT03, que falha se as duas respostas passarem a ser diferentes.
