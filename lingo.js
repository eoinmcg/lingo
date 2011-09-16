// Lingo
// Entry for 10k.aneventapart.com by @eoinmcg
// Copyright (c) Eoin McGrath 2011
// License: http://creativecommons.org/licenses/by-sa/3.0/
var LO = {

    codes: [],
    langs: {},
    trans: {},
    qz: {},
    scores: {},
    curr: localStorage.curr || 'it',
    phrases: ['Hello', 'Goodbye', 'A cold beer, please'],

    api: function(method, data, callback) {
        method = method || 'Translate';
        data = data || {};
        // please create your own key if forking this app
        data.appId = 'BC9A37B4174332CDC3E7591ABFE67BFCF2D616C9';
        var url = 'http://api.microsofttranslator.com/V2/Ajax.svc/' + method;
        return $.ajax({
            url: url,
            dataType: 'jsonp',
            jsonp: 'oncomplete',
            data: data,
            success: function(response) {
                data.appId = '';
                callback(response, data, method); 
            },
            error: function(e) {
                alert('Error:' + e.statusText);
            }
        });
    },

    saveTrans: function(lang, text, trans) {
        LO.trans[lang][text] = trans;
        localStorage.trans = (JSON.stringify(LO.trans));
    },

    getTrans: function(data, callback) {

        callback = callback || LO.showPhrase;
        data.from = 'en'; data.to = LO.curr;

        if (typeof LO.trans[LO.curr] === 'undefined') {
            LO.trans[LO.curr] = {};
        }

        if (typeof LO.trans[LO.curr][data.text] === 'undefined') {
            LO.api('Translate', data, function(r) {
                LO.saveTrans(data.to, data.text, r);
                data.trans = r;
                callback(data);
            });
        } else {
           data.trans = LO.trans[data.to][data.text];
            callback(data);
        }

    },

}

LO.init = function() {

    var v = document.createElement('audio');
    LO.hasAudio = (v.canPlayType('audio/wav') !== '')
        ? true : false;

    if (localStorage.phrases) {
        LO.phrases = JSON.parse(localStorage.phrases);
    }

    if (localStorage.trans) {
        LO.trans = JSON.parse(localStorage.trans);
    } 
    
    if (localStorage.scores) {
        LO.scores = JSON.parse(localStorage.scores);
    } 

    LO.api('GetLanguagesForTranslate', null, function(l_codes) {

        LO.codes = l_codes;
        var l_names,
            l_speak,
            i, x,
            codes = JSON.stringify(l_codes);
            
            LO.api('GetLanguageNames', { locale: 'en', languageCodes: codes }, function(tmp) {
            l_names = tmp;

            LO.api('GetLanguagesForSpeak', null, function(tmp) {
                l_speak = tmp; 

                for (i = 0; i < l_names.length; i += 1) {
                    var l = l_codes[i];
                    var n = l_names[i];
                    var s = 0;

                    for (x = 0; x < l_speak.length; x += 1) {
                        if (l_speak[x] === l) {
                            s = 1;
                        }
                    }

                    LO.langs[l] = {c: l, n: n, s: s};
                }

                $('#curr em').html(LO.langs[LO.curr].n);
            });
        });
    });

};


LO.home = function() {
    $('#a').html('<h1>Welcome</h1>');
    $('#a').append('<p> Want some help learning a new language?  <br />Lingo lets you gather useful words and phrases. Once you\'ve learnt them take the quiz to see how good your knowledge really is.  </p> <p><a class="bn" href="javascript:LO.main();">Get Started &raquo;</a></p>');
};

LO.list = function() {
   var i;
   $('#a').html('<h1>Choose a language</h1>');
   for (i = 0; i < LO.codes.length; i += 1) {
        var tmp = LO.langs[LO.codes[i]];
        var score = LO.totalScore(tmp.c);
        var s = (score) ? '<br /><small>'+score.total+'% in '+score.quiz+' test(s)</small>' : '';
        var cl = (tmp.s && LO.hasAudio) ? 'ln sp' : 'ln';
        var ln = '<a class="r '+cl+'" href="javascript: LO.changeCurr(\''+ 
                    tmp.c+'\')">' + tmp.n + s + '</a>';
        $('#a').append(ln);
   }
};

LO.main = function() {
    var i;
    $('#a').html('');
    var form =  '<form id="addPhrase" onsubmit="LO.addPhrase();return false;">' +
                '<input type="text" required="true" placeholder="Add phrase" name="phrase" />' +
                '<input type="submit" value="+"></form>';
    $('#a').append(form);

    for (i = this.phrases.length-1; i >= 0; --i) {
        LO.getTrans({text: LO.phrases[i], ignore: i}, LO.showphrase);
    }
};


LO.buildPhrase = function(ignore, trans) {
    var del = '<a href="javascript:LO.delPhrase(\''+ignore+'\')" class="del">x</a>';
    var s = (LO.langs[LO.curr].s === 1 && LO.hasAudio)
        ? '<a class="lis sp" href="javascript:LO.say(\''+ escape(trans) +'\')">'
        : '';
    var p = s + '<div class="phr r" id="phrase_'+ignore+'">' + 
            '<small>' + LO.phrases[ignore] + '</small>' + 
            '<br /><strong>' + trans + '</strong>' + 
            del + '</div>'; 
     if (s.length) {
        p += '</a>';
     }
    return p;
};

LO.showPhrase = function(d) {

    var p = LO.buildPhrase(d.ignore, d.trans);
    $('#a').append(p).slideDown();

};

LO.say = function(txt) {
    var data = {format: 'audio/wav', language: LO.curr, text: txt};
    LO.api('Speak', data, function(r) {
        var snd = new Audio(r);
        snd.play();
    });
};


LO.quiz = function() {

    LO.quizQ();

    $('#a').html('<h1>Test your knowledge</h1>');
    $('#a').html('<p>Q '+LO.qs.c+' of '+LO.qs.q+'</p>');
    var q = LO.qs.l[LO.qs.c];
    var a = LO.trans[LO.curr][q];
    var qn = '<p class="r hi">Translate:<br /><strong>' + q + '</strong></p>';
    var f = '<form id=q onsubmit="LO.quizA();return false;">'+
            '<input type=hidden name=q value="' + a + '">' +
            '<input type=text placeholder=Answer required=true autocomplete=off name=a />' +
            '<input type="submit" value="&raquo;" />' +
            '</form>';

    $('#a').append(qn);
    $('#a').append(f);
   
};

LO.quizQ = function() {
    if (sessionStorage.qs) {
        LO.qs = JSON.parse(sessionStorage.qs);
        return;
    } 
  
    var p = LO.phrases;
    p.sort(function(a,b) {
        return (0.5 - Math.random());
     });
     if (p.length > 9) {
        p.splice(9, p.length);
     }
     LO.qs = { c: 1, q: p.length-1, l: p, s: 0  };
     sessionStorage.qs = JSON.stringify(LO.qs);

};

LO.quizA = function() {
    var q = $('form input[name=q]').val();
    var a = $('form input[name=a]').val();
    var c = '';
    if (q.toLowerCase() === a.toLowerCase()) {
        LO.qs.s += 1;
        c = '<p class="ok r">Correct!</p>';
    } else {
        c = '<p class="er r"><s>'+a+'</s><br />The answer was '+q+'</p>';
    }
    if (LO.qs.c >= LO.qs.q) {
        var per = ~~((LO.qs.s / LO.qs.q) * 100);
        c += 'Quiz finished. you got '+LO.qs.s+' out of '+LO.qs.q + ' ('+ per +')%';
        LO.quizS(LO.curr, per);
        LO.qs = null; sessionStorage.removeItem('qs');
    } else {
        c += '<a href="javascript:LO.quiz();" class="bn">Next Question &raquo;</a>';
        LO.qs.c += 1;
        sessionStorage.qs = JSON.stringify(LO.qs);
    }

    $('form').hide();
    $('p.hi').hide().removeClass('hi r').html(c).slideDown();

};

LO.quizS = function(lang, per) {

    if (typeof LO.scores[lang] === 'undefined') {
        LO.scores[lang] = { total: per, quiz: 1 };
    } else {
        var tmp = LO.scores[lang];
        tmp.quiz += 1;
        tmp.total = ~~((tmp.total + per) / 2);
        LO.scores[lang] = tmp;
    }

    localStorage.scores = JSON.stringify(LO.scores);

};

LO.quizR = function() {
    LO.qs = undefined;
    sessionStorage.removeItem('qs');
};

LO.addPhrase = function() {
    var phrase = $('#addPhrase input:first').val();
    LO.phrases.push(phrase);
    var i = LO.phrases.length - 1;
    localStorage.phrases = JSON.stringify(LO.phrases);
    LO.quizR();
    $('body').append('<div id="loading">Loading</div>');
    LO.getTrans({text: LO.phrases[i], ignore: i}, function(d) {
        var p = LO.buildPhrase(d.ignore, d.trans);
        $(p).insertBefore('#a div:first').hide().slideDown();
        $('#addPhrase input:first').val('').blur();
        $('#loading').fadeOut('fast').remove();
    });
};


LO.delPhrase = function(t) {
    LO.phrases.splice(t, 1);
    localStorage.phrases = JSON.stringify(LO.phrases);
    LO.quizR();
    $('#phrase_'+t).addClass('pk').slideToggle('fast');
};

LO.changeCurr = function(lang) {
    var tmp = LO.langs[lang];
    $('#curr em').html(tmp.n).attr('id', tmp.c);
    LO.curr = tmp.c;
    localStorage.curr = tmp.c;
    window.location.hash = '#phrases';
};

LO.totalScore = function(lang) {

    if (typeof LO.scores[lang] === 'undefined') {
        return;
    } else {
        return LO.scores[lang];
    }

};

LO.screens = {

    home: function() {
        LO.home();
    },

    quiz: function() {
        LO.quiz();
    },

    list: function() {
        LO.list(); 
    },

    phrases: function() {
        LO.main();
    }


};

LO.router = setInterval(
    function() {
        var chk = window.location.hash.replace('#', '') || 'home';
        if (chk !== LO.page) {
            LO.page = chk;
            try {
                LO.screens[chk].call();
            } catch(e) {
                LO.screens['home'].call();
            }
        } 
    }, 120
); 


LO.init();
