import multer from 'multer';
import path from 'path';

const pathUploads = path.resolve(__dirname, '..', '..', 'tmp');
export default {
  pathUploads,
  storage: multer.diskStorage({
    destination: pathUploads,
    filename: (req, file, cb) => {
      const extname = path.extname(file.originalname);
      const basename = path.basename(file.originalname, extname);
      return cb(null, `${basename}-${Date.now()}${extname}`);
    },
  }),
};
