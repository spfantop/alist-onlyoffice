const express = require('express')
const router = express.Router()
const config = require('../config.json')
const fs = require('fs')
const axios = require('axios')
const path = require('path')
const jwt = require('jsonwebtoken')
const crypto = require('crypto');
const https = require("https");

function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch (_) {
        return false;
    }
}

// 对输入的URL进行验证和清洗
function validateAndCleanURL(url) {
    if (!isValidURL(url)) {
        throw new Error('Invalid URL');
    }

    // 检查URL是否符合你的应用需求，例如只允许特定的域名
    const allowedDomains = config.allowedDomains
    const parsedUrl = new URL(url);
    if (!allowedDomains.includes(parsedUrl.hostname)) {
        throw new Error('Unauthorized domain');
    }

    // 清洗URL，去除不必要的空格和特殊字符
    return encodeURIComponent(url.trim());
}

// 生成更安全的令牌
function generateSecureKey(url) {
    const hash = crypto.createHash('sha256');
    hash.update(url);
    return hash.digest('hex');
}

router.get('/view', (req, res, next) => {
    try {
        const url = req.query.src;
        if (!url) {
            res.status(400).send('Invalid URL');
            return;
        }

        const title = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('?') != -1 ? url.lastIndexOf('?') : url.length);
        const fileType = title.split('.').pop();
        const key = generateSecureKey(url);

        const payload = {
            info: {
                owner: config.owner,
            },
            document: {
                fileType: fileType,
                key: key,
                permissions: {
                    edit: false,
                    comment: true,
                    download: true,
                    print: true,
                    fillForms: true,
                },
                title: title,
                url: url,
            },
            editorConfig: {
                lang: "zh-CN",
                mode: "view",
            },
            height: "950px",
            type: "desktop",
        };

        const token = jwt.sign(payload, config.tokenSecret, {algorithm: 'HS256', expiresIn: '5m'});
        console.log(payload);
        console.log(config.tokenSecret);
        // 使用模板引擎渲染HTML
        res.render('view', {
            title: title,
            fileType: fileType,
            key: key,
            edit: payload.document.permissions.edit,
            comment: payload.document.permissions.comment,
            download: payload.document.permissions.download,
            print: payload.document.permissions.print,
            fillForms: payload.document.permissions.fillForms,
            url: url,
            token: token,
            config: {
                onlyofficeURL: config.onlyofficeURL,
                owner: config.owner,
            },
            mode: payload.editorConfig.mode,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


router.get('/edit', (req, res, next) => {
    try {
        const url = req.query.src;
        if (!url) {
            res.status(400).send('Invalid URL');
            return;
        }

        const title = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('?') != -1 ? url.lastIndexOf('?') : url.length);
        const fileType = title.split('.').pop();
        const key = generateSecureKey(url);
        const callbackUrl = config.host + ":" + config.port + "/callback?" + "fileUrl=" + url;

        const payload = {
            info: {
                owner: config.owner,
            },
            document: {
                fileType: fileType,
                key: key,
                permissions: {
                    edit: true,
                    comment: true,
                    download: true,
                    print: true,
                    fillForms: true,
                },
                title: title,
                url: url,
            },
            editorConfig: {
                lang: "zh-CN",
                mode: "edit",
                callbackUrl: callbackUrl,
            },
            height: "950px",
            type: "desktop",
        };

        const token = jwt.sign(payload, config.tokenSecret, {algorithm: 'HS256', expiresIn: '5m'});
        console.log(payload);
        console.log(config.tokenSecret);
        // 使用模板引擎渲染HTML，这里假设已经安装并配置了EJS
        res.render('view', {
            title: title,
            fileType: fileType,
            key: key,
            edit: payload.document.permissions.edit,
            comment: payload.document.permissions.comment,
            download: payload.document.permissions.download,
            print: payload.document.permissions.print,
            fillForms: payload.document.permissions.fillForms,
            url: url,
            token: token,
            config: {
                onlyofficeURL: config.onlyofficeURL,
            },
            mode: payload.editorConfig.mode,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/callback', async (req, res, next) => {
    axios.defaults.httpsAgent = new https.Agent({rejectUnauthorized: config.rejectUnauthorized});
    if (req.body.status == 2) {
        console.log(req.body);
        const fileData = await axios.get(req.body.url, {responseType: 'arraybuffer'});
        const buff = Buffer.from(fileData.data);
        //登陆alist获取token
        const username = config.username;
        const password = config.password;
        const authUrl = config.alistURL + "/api/auth/login";
        // 发起POST请求以获取Token
        const response = await axios.post(authUrl, {
            Username: username,
            Password: password
        });
        console.log(response.data);
        if (response.data.code !== 200) {
            return res.send("{\"error\":2}");
        }
        const token = response.data.data.token
        const uploadUrl = config.alistURL + "/api/fs/put";
        //解析token获取文件信息
        const pathAfterP = req.query.fileUrl.split('/p/')[1];
        const filename = encodeURIComponent(pathAfterP);
        const alistconfig = {
            method: 'put',
            url: uploadUrl,
            headers: {
                'Authorization': token,
                'File-Path': filename,
                'Content-Type': 'application/octet-stream'
            },
            data: buff
        };
        console.log(alistconfig);
        axios(alistconfig)
            .then(function (response) {
                console.log(response.data)
                return res.send("{\"error\":0}");
            })
            .catch(function (error) {
                console.error(error);
                return res.send("{\"error\":2}");
            });
    }
})
module.exports = router
