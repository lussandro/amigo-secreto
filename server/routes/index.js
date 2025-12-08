const express = require('express');
const router = express.Router();

// Grupos
const gruposController = require('../controllers/gruposController');
router.get('/grupos', gruposController.listarGrupos);
router.get('/grupos/:id', gruposController.obterGrupo);
router.post('/grupos', gruposController.criarGrupo);
router.put('/grupos/:id', gruposController.atualizarGrupo);
router.delete('/grupos/:id', gruposController.deletarGrupo);

// Participantes
const participantesController = require('../controllers/participantesController');
router.get('/grupos/:grupo_id/participantes', participantesController.listarParticipantes);
router.post('/grupos/:grupo_id/participantes', participantesController.criarParticipante);
router.delete('/participantes/:id', participantesController.deletarParticipante);

// Sorteio
const sorteioController = require('../controllers/sorteioController');
router.post('/grupos/:grupo_id/sorteio', sorteioController.realizarSorteio);
router.get('/grupos/:grupo_id/sorteio', sorteioController.obterResultadoSorteio);

// Envio
const envioController = require('../controllers/envioController');
router.post('/grupos/:grupo_id/enviar', envioController.enviarLinks);
router.post('/grupos/:grupo_id/teste-envio', envioController.enviarMensagemTeste);
router.get('/grupos/:grupo_id/envios', envioController.listarEnvios);

// Reveal (público)
const revealController = require('../controllers/revealController');
router.get('/reveal/:token', revealController.revelarAmigo);

// Teste de API
const testController = require('../controllers/testController');
router.post('/teste-api', testController.testarAPI);

module.exports = router;

