'use strict';

const WPAPI = require('wpapi');
const scrapFn = require('./scrap');
const async = require('async');

const { WP_END_POINT, WP_USERNAME, WP_PASSWORD } = process.env;

const wp = new WPAPI({
    endpoint: WP_END_POINT,
    username: WP_USERNAME,
    password: WP_PASSWORD
});

const q = async.queue(function(task, callback) {
    scrapFn(task.id, task.content)
        .then(function(some) {
            console.log(some);
            callback(some);
        });
}, 2);


q.drain = function() {
    console.log('all items have been processed');
};

function refactorMasterSlider(content) {
    const masterSliderRegexp = /<!-- MasterSlider -->(.|[\r\n])+<!-- END MasterSlider -->/g;
    const masterSliderData = content.match(masterSliderRegexp)[0];
    const images = masterSliderData.match(/data-src="[-а-яА-Яa-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b"/g);
    const onlyUrls = images.map(singleUrl => {
        return singleUrl.replace(/data-src="|"/g, '');
    });
    const imgTags = onlyUrls.map(singleLink => {
        return `<img class="aligncenter size-full main-image former-master-slider" src="${singleLink}" />`;
    });
    return content.replace(masterSliderRegexp, imgTags.join('')).replace(/<script(.|[\r\n])+<\/script>/, '');
}

wp.posts().order('asc').perPage(80).search('masterslider').then(function(data) {
    console.log(data.length);
    data.forEach(function(singlePost) {
        q.push({ id: singlePost.id, content: refactorMasterSlider(singlePost.content.rendered) }, function() {
            console.log('finished processing:' + singlePost.id, 'left:' + q.length());
        });
    });
});
