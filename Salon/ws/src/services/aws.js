const AWS = require("aws-sdk");

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_BUCKET_NAME,
  AWS_REGION,
} = process.env;

AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

const s3 = new AWS.S3();

module.exports = {
  uploadToS3(file, filename, acl = "public-read") {
    return new Promise((resolve) => {
      const params = {
        Bucket: AWS_BUCKET_NAME,
        Key: filename,
        Body: file.data,
        ACL: acl,
      };

      s3.upload(params, function (err, data) {
        if (err) {
          //console.log(err);
          return resolve({ error: true, message: err.message });
        }
        return resolve({ error: false, message: data });
      });
    });
  },

  deleteFileS3(key) {
    return new Promise((resolve) => {
      s3.deleteObject(
        {
          Bucket: AWS_BUCKET_NAME,
          Key: key,
        },
        function (err, data) {
          if (err) {
            return resolve({ error: true, message: err.message || err });
          }
          return resolve({ error: false, message: data });
        }
      );
    });
  },
};