import { Router, type IRouter } from "express";
import healthRouter from "./health";
import securityRouter from "./security";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/security", securityRouter);

export default router;
