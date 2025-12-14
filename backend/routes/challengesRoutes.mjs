// Routes Challenges
// - liste/détail, création (upload image/vidéo)
// - commentaires et participations
import express from "express";
import { getChallenges, getChallenge, postChallenge, upload, postUploadImage, postUploadVideo } from "../controllers/challengesController.mjs";
import { getChallengeComments, postChallengeComment } from "../controllers/commentsController.mjs";
import { postParticipation, getParticipationCount, getParticipationsForChallenge, updateParticipationStatus, getParticipationStatus, putMyParticipationProof } from "../controllers/participationsController.mjs";
import { isLoggedInJWT } from "../middlewares/isLoggedInJwt.mjs";
import { isAdmin } from "../middlewares/isAdmin.mjs";
// Initialisation du routeur
const router = express.Router();
// Définition des routes
router.get('/challenges', getChallenges);
router.get('/challenges/:id', getChallenge);
router.post('/challenges', isLoggedInJWT(), upload.fields([{ name: 'image' }, { name: 'video' }]), postChallenge);
router.post('/uploads/image', isLoggedInJWT(), upload.single('file'), postUploadImage);
router.post('/uploads/video', isLoggedInJWT(), upload.single('file'), postUploadVideo);
router.get('/challenges/:id/comments', getChallengeComments);
router.post('/challenges/:id/comments', isLoggedInJWT(), postChallengeComment);
router.post('/challenges/:id/participations', isLoggedInJWT(), postParticipation);
router.get('/challenges/:id/participations/count', getParticipationCount);
router.get('/challenges/:id/participations/me', isLoggedInJWT(), getParticipationStatus);
router.put('/challenges/:id/participations/me', isLoggedInJWT(), putMyParticipationProof);
router.get('/challenges/:id/participations', isAdmin(), getParticipationsForChallenge);
router.put('/participations/:id', isAdmin(), updateParticipationStatus);

export default router;
