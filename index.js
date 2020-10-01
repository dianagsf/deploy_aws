const express = require('express');
var cors = require('cors');
const app = express();         
const bodyParser = require('body-parser');
const port = 3000; //porta padrão
const { query } = require('express');
const sql = require('mssql');
const connStr = "Server=54.232.137.218;Database=DBELEICAO;User Id=bline;Password=bline1;";

const pool = new sql.ConnectionPool(connStr);
const poolConnect = pool.connect();

//fazendo a conexão global
sql.connect(connStr)
   .then(conn => global.conn = conn)
   .catch(err => console.log(err));


//configurando o body parser 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

//definindo as rotas
const router = express.Router();
router.get('/', (req, res) => res.json({ message: 'Funcionando!' }));
app.use('/', router);

//inicia o servidor
app.listen(port);
console.log('API funcionando!');

// função de query
function execSQLQuery(sqlQry, res){
    global.conn.request()
               .query(sqlQry)
               .then(result => res.json(result.recordset))
               .catch(err => res.json(err));
}





// Login
router.get('/login', (req, res) => {
    let filter = ''

    //if(req.query.cpf && req.query.dataNasc) filter = ` CPF = CAST(${req.query.cpf} as varchar(12)) AND NASCIMENTO = CONVERT(DATE, ${req.query.dataNasc})`
    if(req.query.cpf && req.query.dataNasc) filter = ` CPF = '${req.query.cpf}' AND NASCIMENTO = CONVERT(DATE, '${req.query.dataNasc}');` 
    execSQLQuery('SELECT * FROM ASSOC WHERE' + filter, res)
})

// buscar candidatos por região
router.get('/delegados', (req, res) => {
    let filter = ''

    if(req.query.area) filter = ` AREA = '${req.query.area}' ORDER BY ASSOCIADO ASC;`
    execSQLQuery('SELECT MATRICULA, NOME, NASCIMENTO, ASSOCIADO, AREA FROM DELEGADOS WHERE' + filter, res)
})

// fotos dos delegados
router.get('/delegado/foto', (req, res) => {
  let filter = ''

  if(req.query.matricula) filter = ` MATRICULA = ${req.query.matricula}`
  execSQLQuery('SELECT FOTO FROM DELEGADOS WHERE' + filter, res)
})


// votos
router.post('/votos', async ({ body }, res) => {
    try {
      const resultado = await pool.request()
        .input('data', body.data.toString())
        .input('candidato', body.candidato)
        .input('area', body.area)
        .query('INSERT INTO VOTOS(DATAHORA, CANDIDATO, AREA) VALUES (@data, @candidato, @area)');
  
      console.log('Linhas afetadas', resultado.rowsAffected);
  
      res.send(resultado);
    } catch(e) {
      console.error(e);
      res.status(500).send('Erro interno');
    }
  });


  // post data voto

  router.put('/assoc/votou', async ({ body }, res) => {
    try {
      const resultado = await pool.request()
        .input('data', body.data.toString())
        .input('matricula', body.matricula)
        .query(`UPDATE ASSOC SET VOTOU_EM = @data WHERE MATRICULA = @matricula;`);
  
      console.log('Linhas afetadas', resultado.rowsAffected);
  
      res.send(resultado);
    } catch(e) {
      console.error(e);
      res.status(500).send('Erro interno');
    }
  });


  // resultado votação

  router.get('/resultado', (req, res) => {
    let filter = ''

    if(req.query.area) filter = ` AREA = '${req.query.area}' GROUP BY CANDIDATO;`
    execSQLQuery('SELECT CANDIDATO, COUNT(CANDIDATO) as QTD_VOTOS FROM VOTOS WHERE' + filter, res)
})



