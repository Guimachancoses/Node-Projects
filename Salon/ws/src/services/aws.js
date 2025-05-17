const AWS = require("aws-sdk");

module.exports = {
  IAM_USER_KEY: "AKIAW3TNI5V7ULV5U5F3",
  IAM_USER_SECRET: "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",
  BUCKET_NAME: "salon-bucket-guimac",
  AWS_REGION: "us-east-2",
  uploadToS3: function (file, filename, acl = "public-read") {
    return new Promise((resolve, reject) => {
      let IAM_USER_KEY = this.IAM_USER_KEY;
      let IAM_USER_SECRET = this.IAM_USER_SECRET;
      let BUCKET_NAME = this.BUCKET_NAME;

      // Estabelece uma pré conecção com o S3
      let s3bucket = new AWS.S3({
        accessKeyId: IAM_USER_KEY,
        secretAccessKey: IAM_USER_SECRET,
        Bucket: BUCKET_NAME,
      });

      // Conecta com o S3, e função de callback após conexão
      s3bucket.createBucket(function () {
        var params = {
          Bucket: BUCKET_NAME,
          Key: filename, // nome do arquivo
          Body: file.data, // conteudo do aquivo
          ACL: acl, // controle de acesso (publico ou privado)
        };

        // Após a conexão aberta faz o upload e um callback
        s3bucket.upload(params, function (err, data) {
          if (err) {
            console.log(err);
            return resolve({ error: true, message: err.message });
          }
          console.log(data);
          return resolve({ error: false, message: data });
        });
      });
    });
  },
  deleteFileS3: function (key) {
    return new Promise((resolve, reject) => {
      let IAM_USER_KEY = this.IAM_USER_KEY;
      let IAM_USER_SECRET = this.IAM_USER_SECRET;
      let BUCKET_NAME = this.BUCKET_NAME;

      // Estabelece uma pré conecção com o S3
      let s3bucket = new AWS.S3({
        accessKeyId: IAM_USER_KEY,
        secretAccessKey: IAM_USER_SECRET,
        Bucket: BUCKET_NAME,
      });

      s3bucket.createBucket(function () {
        s3bucket.deleteObject(
          {
            Bucket: BUCKET_NAME,
            Key: key,
          },
          function (err, data) {
            if (err) {
              //console.log(err);
              return resolve({ error: true, message: err });
            }
            //console.log(data);
            return resolve({ error: false, message: data });
          }
        );
      });
    });
  },
};
