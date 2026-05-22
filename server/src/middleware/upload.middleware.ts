import multer from 'multer'
import { AppError } from '@/utils/appError.js'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 *1024

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_SIZE},
    fileFilter: (_, file, cb) => {
        if(ALLOWED_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new AppError('Invalid file type. Only JPEG, PNG, and WEBP are allowed.', 400))
        }
    }
})