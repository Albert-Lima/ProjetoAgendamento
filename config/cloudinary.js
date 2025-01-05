const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: 'dogiuquek', 
    api_key: '416862945642377', 
    api_secret: 'usqfwbYXixMy4WUTKuo9mo3E5sk' 
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'profissionais', // Pasta onde as imagens serão armazenadas
        format: async () => 'jpeg', // Formato da imagem
        public_id: (req, file) => `profissional-${Date.now()}`, // Nome único para o arquivo
    },
});

const upload = require('multer')({ storage });

module.exports = { cloudinary, upload };
