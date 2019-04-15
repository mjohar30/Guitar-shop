//1. IMPORTACIONES
const express = require('express')
const app = express()

const port = process.env.PORT || 3002

const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')

require('dotenv').config()


// 2. MIDDLEWARES
//urlencoded sirve para leer los query params
app.use(express.urlencoded({extended: true}))
//para leer los json sin problemas
app.use(express.json())
//Inyectar cookies al cliente
app.use(cookieParser())

//3. MODELOS
const  { User } = require('./models/user')
const { auth } = require('./middleware/auth')
const { Brand } = require('./models/brand')
const { admin } = require('./middleware/admin')
const { Wood } = require('./models/wood')

// 4. RUTAS
  app.post('/api/users/register', (req, res) => {
    const user = new User(req.body)
    user.save((err, doc) => {
        if(err) return res.json({success: false, err})
        res.status(200).json({
            success: true
        })
    })
})

app.post('/api/users/login', (req, res) => {
    // 1. Encuentra el correo
        User.findOne({'email': req.body.email}, (err,user) => {
            if(err) return res.send(err)
            if(!user) return res.json({loginSuccess: false, message: 'Auth fallida, email no encontrado'})

    // 2. Obtén el password y compruébalo
            user.comparePassword(req.body.password, (err, isMatch) => {
              if(!isMatch) return res.json({loginSuccess: false, message: "Wrong Password"})

    // 3. Si todo es correcto, genera un token
              user.generateToken((err, user)=> {
                if(err) return res.status(400).send(err)
                    // Si todo bien, debemos guardar este token como un "cookie"
                    res.cookie('guitarshop_auth', user.token).status(200).json(
                        {loginSuccess: true}
                    )
                })
            })
        })
})

app.get('/api/users/auth', auth, (req, res) => {
    res.status(200).json({
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role,
        cart: req.user.cart,
        history: req.user.history
    })
})


app.get('/api/users/logout', auth, (req, res) => {
    User.findOneAndUpdate(
        {_id: req.user._id},
        {token: ''},
        (err, doc) => {
            if(err) return res.json({success: false, err})
            return res.status(200).json({
                success: true
            })
        }
    )
})

app.post('/api/product/brand', auth, admin, (req, res) => {
    const brand = new Brand(req.body)
    brand.save((err, doc) => {
        if(err) return res.json({success: false, err})
        res.status(200).json({
            success: true,
            brand: doc
        })
    })
})

app.get('/api/product/brands', (req, res) => {
    Brand.find({}, (err, brands) => { 
        if(err) return res.status(400).send(err)
        res.status(200).send(brands)
    })
})

app.post('/api/product/wood', auth, admin, (req, res) => { 
    const wood = new Wood(req.body)
    wood.save((err,doc) => {
        if(err) return res.json({success: false, err})
        res.status(200).json({
            success: true,
            wood: doc
        })
    })
})

app.get('/api/product/woods', (req, res) => {
    Wood.find({}, (err, woods) => {
        if(err) return res.status(400).send(err)
        res.status(200).send(woods)
    }) 
})

mongoose.connect(process.env.DATABASE, { useNewUrlParser: true }, (err) => {
    if(err) return err
    console.log("Conectado a MongoDB")
  })

// 5. LISTENERS
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`)
  })