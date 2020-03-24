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
    let data = req.body
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

app.post('/login/dokter', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	if (username && password) {
		conn.query('SELECT * FROM dokter WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				req.session.loggedin = true;
				req.session.username = username;
				res.redirect('/home');
			} else {
				res.send('Username atau Password salah!');
			}			
			res.end();
		});
	} else {
		res.send('Masukkan Username and Password!');
		res.end();
	}
});


app.get('/home',function(req,res){
    if (req.session.loggedin){
        res.send('Selamat Datang,' + req.session.username + '|');
    }else{
        res.send('Silahkan login terlebih dahulu!');
    }
    res.end();
});

/********************** CRUD DOKTER ***************/
// endpoint get data dokter yang ada di database
app.get('/dokter', isAuthorized, (req, res) => {
    let sql = `
        select * from dokter
    `

    conn.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            success: true,
            message: 'berhasil mendapatkan data dokter',
            data: result
        })
    })
})

// endpoint add data dokter ke dataase
app.post('/dokter', isAuthorized, (req, result) => {
    let data = req.body

    let sql = `
        insert into dokter (username, password, nama_dokter, alamat, jenis_kelamin, spesialis, nomor_hp)
        values ('`+data.username+`', '`+data.password+`', '`+data.nama_dokter+`', '`+data.alamat+`', '`+data.jenis_kelamin+`', '`+data.spesialis+`','`+data.nomor_hp+`');
    `

    conn.query(sql, (err, result) => {
        if (err) throw err
    })

    result.json({
        success: true,
        message: 'Berhasil menambahkan data dokter baru!'
    })
})

// endpoint menampilkan data dokter dengan id menggunakan token
app.get('/dokter/:id', isAuthorized, (req, res)=>{
    let sql = `
        select * from dokter
        where id = `+req.params.id+`
        limit 1
    `
    conn.query(sql, (err, result)=>{
        if (err) throw err
        res.json({
            message: 'berhasil mendapatkan data dokter',
            data: result[0]
        })
    })
})

// endpoint edit data dokter ke database
app.put('/dokter/:id', isAuthorized, (req, res) => {
    let data = req.body

    let sql = `
        update dokter
        set username ='`+data.username+`', password ='`+data.password+`', nama_dokter = '`+data.nama_dokter+`', alamat = '`+data.alamat+`', jenis_kelamin = '`+data.jenis_kelamin+`', spesialis = '`+data.spesialis+`', nomor_hp = '`+data.nomor_hp+`'
        where id = `+req.params.id+`
        `

    conn.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            success: true,
            message: 'Datadokter berhasil diubah!',
            data: result
        })
    })
})

// endpoint hapus data dokter dari database
app.delete('/dokter/:id', isAuthorized, (req, res) => {
    let sql = `
        delete from dokter 
        where id = `+req.params.id+`
    `

    conn.query(sql, (err, result) => {
        if (err) throw err
        res.json({
            success: true,
            message: 'Data dokter berhasil dihapus',
            data: result
        })
    })
})

/********************** RUN APPLICATION ***************/
app.listen(port, () => {
    console.log('App running on port ' + port)
})

