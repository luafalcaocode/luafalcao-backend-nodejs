const config = require("../config/config");
const emailModel = require("../models/email.model");
const emailService = require("../services/email.service");
const fileService = require("../services/file.service");

const express = require("express");
const formidable = require("formidable");
const fs = require("fs");
const nodemailer = require("nodemailer");
const path = require("path");

const router = express.Router();

router.post("/solicitacao", (request, response, next) => {
  const form = new formidable.IncomingForm();
  form.multiples = true;
  form.uploadDir = path.join(__dirname, "../", "uploads");
  form.maxFileSize = 25 * 1024 * 1024;

  fs.access(form.uploadDir, (err) => {
    if (err && err.code === "ENOENT") {
      fs.mkdir(form.uploadDir, (err) => {
        console.log(err);
      });
    }
  });

  form.on("file", (field, file) => {
    fs.renameSync(file.path, path.join(form.uploadDir, file.name));
  });

  form.parse(request, (err, fields, files) => {
    if (!err) {
      emailModel.credentials = {  
        user: config.email.credentials.user,
        password: config.email.credentials.password,
      };
      emailModel.options = {
        from: config.email.options.from,
        to: config.email.options.to,
        subject: config.email.options.subject,
        html: emailService.buildOrderServiceTemplate(fields),
        attachments: [],
      };
      emailModel.smtp = config.email.smtp;

      fs.readdir(config.uploadDir, (err, filenames) => {
        fileService.openFilesAsStreamAsync(filenames).then((data) => {
            if (data != null && data.length > 0) {
              data.forEach((item) => {
                emailModel.options.attachments.push({
                  filename: item.name,
                  content: item.bytes,
                });
              });              
           
              emailService.send(emailModel).then(() => {
                response.status(config.statusCode.success).send({message: "the data was sent successfuly!", success: true});                
                fileService.removeFilesAsync(filenames).then(() => {
                  console.log('file removed');
                })
                .catch((err) => {
                   console.log(err);
                });
              })
              .catch((err) => {
                response.status(config.statusCode.boom).send({ message: err.message, success: false});
              });
            }
          })
          .catch((err) => {
            response.status(config.statusCode.boom).send({ message: err.message, success : false });
          })
        });
    } else {
        response.status(config.statusCode.bad).send({ message: err.message, success: false });
    }
  });
});

router.get("/solicitacao", (request, response, next) => {
  response.send("<h1>API works</h1>");
});

module.exports = router;
