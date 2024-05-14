const express = require('express')
const path = require('path')
const logger = require('morgan')

const indexRouter = require('./routes/index')

const app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/', indexRouter)
// 设置EJS为视图引擎
app.set('view engine', 'ejs');
// 设置视图文件所在的目录，通常是'views'
app.set('views', __dirname + '/views');
module.exports = app