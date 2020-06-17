const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const http = require('http');
const https = require('https');
const solicitacaoServicoRoutes = require('./routes/solicitacao-servico');
const credentials = { key: fs.readFileSync('key.pem', 'utf8'), cert: fs.readFileSync('cert.pem', 'utf8') };
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

const config = require('./config/config');

app.set('view engine', 'pug');
app.set('views', 'views');

app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static(config.publicFolder)); 

app.use(cors());
app.use('/api/servicos', solicitacaoServicoRoutes);
app.use((request, response, next) => {
    response.status(config.statusCode.notFound).render('404');
});

httpServer.listen(7777);
httpsServer.listen(8091);
