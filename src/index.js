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
            console.log(address);

            request(url)
                .on('end',function () {
                    setTimeout(function () {
                        cb(null);
                    },2000);
                })
                .on('error',function (err) {
                    if (err) {
                        console.error(err);
                    }

                    setTimeout(function () {
                        cb();
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
            // filing_id: 1079423 // latest Trump filing
            filing_id: 1079219 // latest Clinton filing
        },
        limit: 20000, // respect the 25,000 per day limit
        attributes: ['payee_street_1','payee_city','payee_state','payee_zip_code']
    })
    .then(function (expenditures) {
        console.log(expenditures.length);

        var q = async.queue(takePhoto,1);

        q.push(expenditures);

        //q.drain = queueExpenditures;
    });
}

queueExpenditures();
