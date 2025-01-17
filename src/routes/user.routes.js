import { Router } from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserAvatar, updateUserCoverImage, updateUserDetails } from '../controllers/user.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/').get(verifyJWT, getCurrentUser).post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverImage',
            maxCount: 1
        }
    ]),
    registerUser
)

router.route('/login').post(loginUser);
router.route('/logout').post(verifyJWT, logoutUser);

router.route('/refresh-token').post(refreshAccessToken);
router.route('/change-password').post(verifyJWT, changeCurrentPassword);
router.route('/current-user').get(verifyJWT, getCurrentUser);

router.route("/update-user").patch(upload.none(), verifyJWT, updateUserDetails);
router.route('/:id').get().put().delete(); //?todo
router.route("/update-avatar").patch(verifyJWT, upload.single('avatar'), updateUserAvatar);
router.route("/update-coverImg").patch(verifyJWT, upload.single('coverImage'), updateUserCoverImage);

router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/watch-history").get(verifyJWT, getWatchHistory);


export default router;