/**
 * @file user.integration.spec.ts
 * @description Suíte de Testes de Integração para a API de Gestão de Usuários.
 * 
 * Tecnologias utilizadas:
 * - Vitest: Framework moderno e rápido de testes.
 * - Supertest: Biblioteca para simulação de requisições e asserções HTTP.
 * - Express: Framework leve do Node.js utilizado para simular o servidor backend e as regras da API em memória.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';

// ============================================================================
// 1. MOCK DO SERVIDOR BACKEND (API SIMULADA)
// ============================================================================
// Instancia a aplicação Express para mocar o comportamento do servidor real,
// permitindo testar contratos e regras de negócio de forma isolada e segura.
const app = express();
app.use(express.json()); // Habilita o parse automático de payloads em formato JSON

// Banco de dados em memória simulado (contém massa inicial para testes de conflito)
let users: any[] = [
  { id: 'user-existente-2', nome: 'Outro Usuário', email: 'duplicado@email.com', status: 'ativo' }
];

/**
 * Rota POST: Simula o cadastro de um novo usuário.
 * Retorna: 201 (Created) e o objeto JSON criado.
 */
app.post('/users', (req, res) => {
  // Gera um ID dinâmico baseado no timestamp atual para evitar colisões nos testes
  const newUser = { id: `user-${Date.now()}`, ...req.body };
  users.push(newUser);
  res.status(201).json(newUser);
});

/**
 * Rota PATCH: Simula a atualização parcial de um usuário.
 * Regras de Negócio implementadas para simular cenários reais:
 * - 404: Caso o ID não exista no banco.
 * - 400: Caso o e-mail seja inválido/malformado.
 * - 409: Caso o e-mail já pertença a outro usuário (Conflito).
 * - 200: Sucesso na alteração parcial, persistindo os dados no array.
 */
app.patch('/users/:id', (req, res) => {
  const { id } = req.params;
  const { email, status, perfil } = req.body;

  const userIndex = users.findIndex((u) => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  if (email === 'invalido') {
    return res.status(400).json({ error: 'E-mail inválido ou malformado.' });
  }

  if (email === 'duplicado@email.com') {
    return res.status(409).json({ error: 'E-mail já está em uso por outro usuário.' });
  }

  // Atualiza apenas os campos enviados no payload (atualização parcial)
  users[userIndex] = {
    ...users[userIndex],
    ...(email && { email }),
    ...(status && { status }),
    ...(perfil && { perfil })
  };

  res.status(200).json(users[userIndex]);
});

/**
 * Rota GET: Consulta de usuário por ID.
 * - 404: Se o registro não for localizado.
 * - 200: Retorna o objeto JSON do usuário encontrado.
 */
app.get('/users/:id', (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }
  res.json(user);
});

/**
 * Rota DELETE: Exclusão de um recurso por ID.
 * - 404: Se o registro não for localizado.
 * - 204: Sucesso na remoção (No Content).
 */
app.delete('/users/:id', (req, res) => {
  const userIndex = users.findIndex((u) => u.id === req.params.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }
  
  users.splice(userIndex, 1); // Remove o usuário do banco em memória
  res.status(204).send();
});

// Configuração de porta e instância do servidor HTTP local
let server: any;
const PORT = 3333;

// ============================================================================
// 2. SUÍTE DE TESTES DE INTEGRAÇÃO
// ============================================================================
describe('Testes de Integração - Gestão de Usuários (API Enterprise)', () => {
  let createdUserId: string;

  /**
   * Hook de Setup (beforeAll):
   * Executado uma única vez antes de iniciar os testes da suíte.
   * Objetivo: Iniciar o servidor HTTP local e injetar uma massa de dados base.
   */
  beforeAll(async () => {
    await new Promise((resolve) => {
      server = app.listen(PORT, () => resolve(true));
    });

    // Cria massa de dados padrão para os testes que exigem um recurso pré-existente
    const response = await request(server)
      .post('/users')
      .send({
        nome: 'Usuário Temporário QA',
        email: 'temp.qa@email.com',
        status: 'pendente'
      });
    
    createdUserId = response.body.id;
  });

  /**
   * Hook de Teardown (afterAll):
   * Executado após a conclusão de todos os testes.
   * Objetivo: Fechar a conexão do servidor para liberar portas e recursos da máquina.
   */
  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  // --------------------------------------------------------------------------
  // GRUPO 1: CAMINHOS FELIZES - Testes de Contrato e Persistência 
  // --------------------------------------------------------------------------

  it('Deverá atualizar parcialmente o usuário com sucesso e persistir no banco (GET após PATCH)', async () => {
    const payloadUpdate = {
      status: 'ativo',
      perfil: {
        cargo: 'QA Automation Engineer'
      }
    };

    // Passo 1: Executa a requisição PATCH para modificar o recurso
    const patchResponse = await request(server)
      .patch(`/users/${createdUserId}`)
      .send(payloadUpdate);

    // Validação de contrato e sucesso do PATCH
    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.status).toBe('ativo');

    // Passo 2: Consulta o banco via GET para garantir persistência real
    const getResponse = await request(server).get(`/users/${createdUserId}`);
    
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.status).toBe('ativo');
    expect(getResponse.body.perfil.cargo).toBe('QA Automation Engineer');
  });

  // --------------------------------------------------------------------------
  // GRUPO 2: CENÁRIOS DE EXCEÇÃO E VALIDAÇÕES DE NEGÓCIO
  // --------------------------------------------------------------------------

  it('Deverá retornar 400 Bad Request ao enviar dados inválidos no PATCH', async () => {
    const response = await request(server)
      .patch(`/users/${createdUserId}`)
      .send({ email: 'invalido' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'E-mail inválido ou malformado.');
  });

  it('Deverá retornar 409 Conflict ao tentar atualizar para um e-mail já existente', async () => {
    const response = await request(server)
      .patch(`/users/${createdUserId}`)
      .send({ email: 'duplicado@email.com' });

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('error', 'E-mail já está em uso por outro usuário.');
  });

  it('Deverá retornar 404 Not Found ao tentar atualizar um usuário inexistente', async () => {
    const response = await request(server)
      .patch('/users/id-que-nao-existe')
      .send({ status: 'ativo' });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Usuário não encontrado.');
  });

  // --------------------------------------------------------------------------
  // GRUPO 3: IDEMPOTÊNCIA DO DELETE 
  // --------------------------------------------------------------------------

  it('Deverá garantir a idempotência ao tentar deletar o mesmo usuário duas vezes', async () => {
    // Passo 1: Cria um usuário isolado exclusivamente para este teste de exclusão
    const tempUser = await request(server)
      .post('/users')
      .send({ nome: 'Para Teste de Idempotencia', email: 'idemp@email.com' });
    
    const targetId = tempUser.body.id;

    // Passo 2: Primeira exclusão do recurso (Espera-se sucesso absoluto: 204 No Content)
    const firstDelete = await request(server).delete(`/users/${targetId}`);
    expect(firstDelete.status).toBe(204);

    // Passo 3: Segunda exclusão do mesmo recurso (Idempotência: Como o recurso já foi apagado,
    // o sistema deve retornar 404 Not Found de forma previsível, sem quebrar o servidor).
    const secondDelete = await request(server).delete(`/users/${targetId}`);
    expect(secondDelete.status).toBe(404);
    expect(secondDelete.body).toHaveProperty('error', 'Usuário não encontrado.');
  });
});