# 🚀 API Integration Testing Suite (TypeScript & Vitest)

[![Vitest](https://img.shields.io/badge/Vitest-v5.0-brightgreen.svg)](https://vitest.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![Supertest](https://img.shields.io/badge/Supertest-HTTP-orange.svg)](https://github.com/ladjs/supertest)
[![Status](https://img.shields.io/badge/Status-Passing-success.svg)]()

Suíte de testes de integração de **nível corporativo (Enterprise)** para validação de contratos, fluxos de negócio, auditoria de persistência e tratamento de exceções em APIs RESTful. Desenvolvida utilizando **TypeScript**, **Vitest** e **Supertest**, com simulação de servidor via **Express**.

---

## 📋 Sumário
1. [Visão Geral](#-visão-geral)
2. [Arquitetura e Tecnologias](#-arquitetura-e-tecnologias)
3. [Estrutura do Projeto](#-estrutura-do-projeto)
4. [Pré-requisitos e Instalação](#-pré-requisitos-e-instalação)
5. [Como Executar os Testes](#-como-executar-os-testes)
6. [Cenários Validados (Matriz de Testes)](#-cenários-validados-matriz-de-testes)
7. [Boas Práticas de QA Aplicadas](#-boas-práticas-de-qa-aplicadas)

---

## 🎯 Visão Geral
O objetivo deste repositório é demonstrar uma abordagem moderna e robusta para automação de testes de API. A suíte valida operações de escrita e modificação parcial (`PATCH`), remoção segura (`DELETE`), além de garantir a integridade de estado e tratamento rigoroso de erros (`400`, `404`, `409`) e idempotência.

---

## 🛠️ Arquitetura e Tecnologias
* **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (Tipagem estrita e escopo global seguro).
* **Test Runner:** [Vitest](https://vitest.dev/) (Execução rápida baseada no Vite).
* **HTTP Assertion Library:** [Supertest](https://github.com/ladjs/supertest) (Simulação de requisições e validação de contratos de rede).
* **Mock Server:** [Express](https://expressjs.com/) (Simulação do ecossistema backend e banco de dados em memória para isolamento total dos testes).

---

## 🗂️ Estrutura do Projeto

```
testesIntegracao/
├── node_modules/             # Dependências do projeto gerenciadas pelo npm
├── src/                      # Código-fonte da aplicação (quando aplicável)
├── test/
│   └── user.integration.spec.ts # Suíte principal de testes de integração
├── package.json              # Metadados, dependências e scripts de execução
├── tsconfig.json             # Configuração estrita do compilador TypeScript
└── vitest.config.ts          # Configuração do ambiente Vitest (globals: true)
```

---

## ⚙️ Pré-requisitos e Instalação

Certifique-se de ter instalado em sua máquina:

* Node.js (Versão 18+ recomendada)
* npm ou yarn / pnpm

---

## Passo a passo para clonar e configurar o ambiente

1 - Clone o repositório ou acesse a pasta do projeto:

```
cd testesIntegracao
```

2 - Instale as dependências do projeto:

```
npm install
```

## 🚀 Como Executar os Testes

Para rodar a suíte de testes de integração em modo de execução única (CI/CD ready):

```
npm test
```

Caso queira executar os testes em modo interativo/watch (ideal para desenvolvimento):

```
npx vitest
```

---

## 🧪 Cenários Validados (Matriz de Testes)

A suíte cobre rigorosamente 5 pilares fundamentais da qualidade de APIs:

```
#	Cenário / Descrição	                         Método	            Rota / Endpoint	  Status Esperado
1	Caminho Feliz e Auditoria (GET após PATCH)	 PATCH + GET	    /users/:id	          200 OK
2	Validação de Payload Inválido (Bad Request)	 PATCH	            /users/:id	          400 Bad Request
3	Conflito de Regra de Negócio (E-mail Duplicado)	 PATCH	            /users/:id	          409 Conflict
4	Tratamento de Recurso Inexistente	         PATCH	            /users/:id	          404 Not Found
5	Idempotência de Exclusão (Delete Duplo)	         DELETE	            /users/:id	          204 No Content → 404 Not Found
```

---

## 📐 Boas Práticas de QA Aplicadas

1 - **Isolamento de Massa:** Uso de ganchos de ciclo de vida (beforeAll e afterAll) para provisionar e destruir dados dinamicamente, eliminando dependência entre testes (flaky tests).
2 - **Auditoria de Efeito Colateral:** O teste de alteração (PATCH) não valida apenas o retorno da requisição, mas dispara uma consulta subsequente (GET) para auditar a persistência real no repositório.
3 - **Validação de Idempotência:** Garantia arquitetural de que requisições destrutivas repetidas (DELETE) mantêm o estado do sistema consistente e previsível.
4 - **Padronização de Contratos:** Respostas de erro estruturadas seguindo o padrão REST corporativo (contendo payload descritivo de erro).
