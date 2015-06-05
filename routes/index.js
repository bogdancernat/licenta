var express      = require('express')
, router         = express.Router()
, mainController = require('../controllers/mainController')
;

/* GET home page. */
router.get('/',
  mainController.showIndex
);

module.exports = router;