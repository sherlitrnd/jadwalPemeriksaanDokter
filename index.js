const express = require('express')
const mysql = require('mysql') 
const bodyParser =require('body-parser')
const session = require('express-session')
const jwt = require('jsonwebtoken')
const app =express()
const port = 1403;

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

const secretKey = 'thisisverysecretkey'

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

const conn = mysql.createConnection({
    host : '127.0.0.1',
    port: '3306',
    user: 'root',
    password: '',
    database: 'dokter'
})

const isAuthorized = (req, result, next) => {
    if (typeof(req.headers['x-api-key']) == 'undefined') {
        return result.status(403).json({
            success: false,
            message:'Unathorized. Token is not provided'
        })
    }

    let token = req.headers['x-api-key']
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return result.status(401).json({
                success:  false,
                message: 'Unathorized. Token is invalid'
            })
        }
    })
    next()
}

/********************** LOGIN ADMIN DAN DOKTER ***************/
app.post('/login/admin',function(req,res){
    let data = request.body
    var username = data.username;
    var password = data.password;
    if(username && password){
        conn.query('SELECT * FROM admin WHERE username =? AND password =?', [username,password], function(error, results,fields){
            if (results.length > 0){
                req.session.loggedin = true;
                req.session.username = data.username;
                res.redirect('/login/admin');
            }else{
                res.send('username atau password salah!');
            }
            res.end();
        })
    }else{
        res.send('Masukkan username dan password!');
        res.end();
    }
});

app.get('/login/admin', function(req, results){
    if (req.session.loggedin){
        let data = req.body
        let token = jwt.sign(data.username + '|' + data.password, secretKey)

        results.json({
            success: true,
            message: 'Login berhasil, Selamat Datang Admin!',
            token:token
        })
    }else{
        results.json({
            success: false,
            message:'Silahkan Login terlebih dahulu!'
        })
    }
    results.end();
});

app.post('/login dokter', function(req, res){
    let data = request.body
    var username = data.username;
    var password = data.password;
    if(username && password){
        conn.query('SELECT * FROM dokter WHERE username =? AND password =?', [username,password], function(error, results,fields){
            if (results.length > 0){
                req.session.loggedin = true;
                req.session.username = data.username;
                res.redirect('/home');
            }else{
                res.send('username atau password salah!');
            }
            res.end();
        })
    }else{
        res.send('Masukkan username dan password!');
        res.end();
    }
});

app.get('/home',function(req,res){
    if (res.session.loggedin){
        res.send('Selamat Datang,' + req.session.username + '|');
    }else{
        res.send('Silahkan login terlebih dahulu!');
    }
    results.end();
});

/********************** CRUD DOKTER ***************/

/********************** RUN APPLICATION ***************/
app.listen(port, () => {
    console.log('App running on port ' + port)
})

