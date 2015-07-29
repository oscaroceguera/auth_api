// app.js - Tutorial Noderos.com

// paquetes necesarios
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var jwt    = require('jsonwebtoken');

var app = express(); // Instancia del servidor express 

var User   = require('./models/user'); // Modelo user
var config = require('./config'); // archivo de configuración

// Configuración
var port = process.env.PORT || config.port;
app.set('superSecret', config.phrase); // setear frase secreta
mongoose.connect(config.database); // conectar a MongoDB
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// RUTAS de la API
var router = express.Router();


//Rutas no Protegidas

// ruta para probar nuestro servidor
router.get('/', function(req, res){
	res.json({message: 'Ándale, arriba arriba, yepa yepa'});
});

// ruta para el registro de usuarios
router.route('/register')
	.post(function(req, res){
		var user = new User();
		user.name = req.body.user;
		user.password = req.body.password;
		user.email = req.body.email;
		
		user.save(function(err){
			if(err) res.send({error:true, message:'Ocurrio un error'});
			res.send({error:false, message:'Usuario registrado con exito'});
		});
	});
	
// ruta para la autenticación de usuarios
// mediante email y password
router.route('/auth')
	.post(function(req, res){
		// find the user
		User.findOne({email: req.body.email}, function(err, user){
			if(err) res.send({error:true, message:'Oops, Ocurrio un error'});
			if(!user){
				res.send({error:true, message:'Usuario no encontrado'});
			}else if(user){
				//comprobar password
				if(user.password != req.body.password){
					res.send({error:true, message:'La contraseña no es correcta'});
				}else{
			        // Si es correcta generamos el token
			        var token = jwt.sign(user, app.get('superSecret'), {
			          expiresInMinutes: 1440 // tiempo de expiración, checar documentacion
			        });
				
					res.send({error:false, message:'Autenticación exitosa', token:token});
				}
			}
		});
	});
	
// Middleware para validar el token
router.use(function(req, res, next){
	// obtener token por get, post o como header
	var token = req.body.token || req.query.token || req.headers['x-access-token'];
	
	if(token){
		jwt.verify(token, app.get('superSecret'), function(err, decoded){
			if(err) res.send({error:true, message:'Token no valido o no existe'});
			req.decoded = decoded; // establecemos el token en el request
			next();
		});
	}else{
		res.status(403).send({error:true, message:'Token no valido o no existe'});
	}
});

// Rutas protegidas por Token

router.get('/users', function(req, res) {
	User.find({}, function(err, users) {
		res.json(users);
	});
});

router.get('/noderos', function(req, res){
	var mensajes = ["Los Jedi no pueden morir", "La capacidad de hablar no te hace inteligente", "Tu enfoque determina tu realidad"];
	res.send({message:mensajes[Math.floor((Math.random() * 3) + 1)]});
});

// Registrar las rutas con prefijo /api
app.use('/api', router);

// Iniciar servidor
app.listen(port);
console.log('La magia esta en el puerto ' + port);


