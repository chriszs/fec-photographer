var async = require('async'),
    request = require('request'),
    models = require('./models'),
    slug = require('slug'),
    fs = require('fs');

function takePhoto(expenditure,cb) {
    var address = '';
    if (expenditure.payee_street_1) {
        address += expenditure.payee_street_1.trim();
    }
    if (expenditure.payee_city) {
        address += ', ' + expenditure.payee_city.trim();
    }
    if (expenditure.payee_state) {
        address += ', ' + expenditure.payee_state.trim();
    }
    if (expenditure.payee_zip_code) {
        address += ', ' + expenditure.payee_zip_code.trim();
    }

    var url = 'https://maps.googleapis.com/maps/api/streetview?size=400x400&location=' +
                encodeURIComponent(address) + '&fov=60&key=' + process.env.GOOGLE_KEY;

    var file = __dirname + '/img/' + slug(address).toLowerCase() + '.png';

    fs.exists(file,function (exists) {
        if (!exists) {
            request(url)
                .on('end',function () {
                    setTimeout(function () {
                        cb(null);
                    },2000);
                })
                .on('error',function () {
                    setTimeout(function () {
                        cb(null);
                    },2000);
                })
                .pipe(fs.createWriteStream(file));
        }
        else {
            cb();
        }
    });

}


function queueExpenditures() {
    models.fec_expenditure.findAll({
        where: {
            filing_id: 1079423 // latest Trump filing
        },
        limit: 100
    })
    .then(function (expenditures) {
        var q = async.queue(takePhoto,1);

        q.push(expenditures);

        //q.drain = queueExpenditures;
    });
}

queueExpenditures();
