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
            message: 'Data dokter berhasil diubah!',
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

/********************** CRUD PASIEN ***************/
app.get('/pasien', isAuthorized, (req, res) => {
    let sql = `
        select * from pasien
    `

    conn.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            success: true,
            message: 'berhasil mendapatkan data pasien',
            data: result
        })
    })
})


app.post('/pasien', isAuthorized, (req, result) => {
    let data = req.body

    let sql = `
        insert into pasien (nama_pasien, alamat, jenis_kelamin, tanggal_lahir, golongan_darah, nomor_hp)
        values ('`+data.nama_pasien+`', '`+data.alamat+`', '`+data.jenis_kelamin+`', '`+data.tanggal_lahir+`','`+data.golongan_darah+`','`+data.nomor_hp+`');
    `

    conn.query(sql, (err, result) => {
        if (err) throw err
    })

    result.json({
        success: true,
        message: 'Berhasil menambahkan data pasien baru!'
    })
})

// endpoint menampilkan data dokter dengan id menggunakan token
app.get('/pasien/:id', isAuthorized, (req, res)=>{
    let sql = `
        select * from pasien
        where id = `+req.params.id+`
        limit 1
    `
    conn.query(sql, (err, result)=>{
        if (err) throw err
        res.json({
            message: 'berhasil mendapatkan data pasien',
            data: result[0]
        })
    })
})

// endpoint edit data dokter ke database
app.put('/pasien/:id', isAuthorized, (req, res) => {
    let data = req.body

    let sql = `
        update pasien
        set nama_pasien ='`+data.nama_pasien+`', alamat ='`+data.alamat+`', jenis_kelamin = '`+data.jenis_kelamin+`', tanggal_lahir = '`+data.tanggal_lahir+`', golongan_darah = '`+data.golongan_darah+`', nomor_hp = '`+data.nomor_hp+`'
        where id = `+req.params.id+`
        `

    conn.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            success: true,
            message: 'Data pasien berhasil diubah!',
            data: result
        })
    })
})

// endpoint hapus data dokter dari database
app.delete('/pasien/:id', isAuthorized, (req, res) => {
    let sql = `
        delete from pasien 
        where id = `+req.params.id+`
    `

    conn.query(sql, (err, result) => {
        if (err) throw err
        res.json({
            success: true,
            message: 'Data pasien berhasil dihapus',
            data: result
        })
    })
})



/********************** CRUD JADWAL PERIKSA ***************/
app.get('/jadwal', isAuthorized, (req, res) => {
    let sql = `
        select * from jadwal_periksa
    `

    conn.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            success: true,
            message: 'berhasil mendapatkan data jadwal periksa',
            data: result
        })
    })
})


app.post('/jadwal', isAuthorized, (req, result) => {
    let data = req.body

    let sql = `
        insert into jadwal_periksa (sakit, tanggal, status)
        values ('`+data.sakit+`', '`+data.tanggal+`', '`+data.status+`');
    `

    conn.query(sql, (err, result) => {
        if (err) throw err
    })

    result.json({
        success: true,
        message: 'Berhasil menambahkan data jadwal periksa baru!'
    })
})

// endpoint menampilkan data jadwal periksa dengan id menggunakan token
app.get('/jadwal/:id', isAuthorized, (req, res)=>{
    let sql = `
        select * from jadwal_periksa
        where id = `+req.params.id+`
        limit 1
    `
    conn.query(sql, (err, result)=>{
        if (err) throw err
        res.json({
            message: 'berhasil mendapatkan data jadwal_periksa',
            data: result[0]
        })
    })
})

// endpoint edit data jadwal periksa ke database
app.put('/jadwal/:id', isAuthorized, (req, res) => {
    let data = req.body

    let sql = `
        update jadwal_periksa
        set sakit ='`+data.sakit+`', tanggal ='`+data.tanggal+`', status = '`+data.status+`'
        where id = `+req.params.id+`
        `

    conn.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            success: true,
            message: 'Data jadwal periksa berhasil diubah!',
            data: result
        })
    })
})

// endpoint hapus data jadwal periksa dari database
app.delete('/jadwal/:id', isAuthorized, (req, res) => {
    let sql = `
        delete from jadwal_periksa 
        where id = `+req.params.id+`
    `

    conn.query(sql, (err, result) => {
        if (err) throw err
        res.json({
            success: true,
            message: 'Data jadwal periksa berhasil dihapus',
            data: result
        })
    })
})

/********************** PROSES ***************/
app.post('/proses/:id', (req, res) => {
    let data = req.body

    conn.query(`
        insert into proses (id_dokter, id_pasien, id_jadwal_periksa)
        values ('`+data.id_dokter+`', '`+data.id_pasien+`', '`+data.id_jadwal_periksa+`')
    `, (err, result) => {
        if (err) throw err
    })

    conn.query(`
        update jadwal_periksa
        set status = 'sudah'
        where id = '`+req.params.id+`'
    `, (err, result) => {
        if (err) throw err
    })

    res.json({
        message: "Data berasil diupdate"
    })
})



/********************** RUN APPLICATION ***************/
app.listen(port, () => {
    console.log('App running on port ' + port)
})

