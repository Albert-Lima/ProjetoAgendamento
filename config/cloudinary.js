const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: 'drmbcuodl', 
    api_key: '796392459734528', 
    api_secret: 'LXPz60bCrL9Hrn-Rn_x0VCpAdC0' 
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
