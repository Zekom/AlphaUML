/**
 *
 * User: MasterLinux
 * Date: 23.02.11
 * Time: 19:58
 *
 * TODO: method for destroy this object completely -> destroy()? and one for destroy only hmtl and events -> deactivate()?
 */
dojo.provide("ui.Object");

dojo.declare("ui.Object", null, {
    globalCat: null,
    placeAt: null,
    htmlId: null,
    connects: null,
    subscribes: null,
    isActivated: null,
    isVisible: null,
    uiType: null,
    id: null,
    x: null,
    y: null,

    constructor: function(args) {
        args = args || {};
        
        this.isActivated = false;
        this.connects = {};
        this.subscribes = {};

        //parent-node id
        this.placeAt = args.placeAt;
    },

    /**
     * creates a unique id
     */
    create: function() {
        //creates unique htmlId
        this.htmlId = this.uniqueId();

        //TODO: subscribe(clearObjects) destroys each object -> this.destroy()
        this.subscribe({
            event: "DeleteObjects",
            lock: true,
            method: function() {
                //remove this completely
                this.destroy(true);
            }
        });
    },

    /**
     * stores reference of this object
     * into the window object
     * @param category string
     */
    setGlobal: function(category) {
        //if category isn't set use the class name as category
        this.globalCat = category || this.declaredClass;

        //create new prototype if doesn't exists
        if(!window.userInterface) {
            window["userInterface"] = {};
        }

        //create new category if necessary
        if(!window.userInterface[this.globalCat]) {
            window.userInterface[this.globalCat] = {};
        }

        //store this object
        window.userInterface[this.globalCat][this.htmlId] = this;
    },

    /**
     * removes this object from globals
     * @param category string
     */
    unsetGlobal: function(category) {
        category = category || this.globalCat;

        if(category && window.userInterface) {
            //get stored objects of the given category
            category = window.userInterface[category];

            //delete this object if registered as global
            if(category && category[this.htmlId]) {
                delete category[this.htmlId];
            }
        }
    },

    /**
     * gets a global stored ui object
     * @param category string
     * @param htmlId string htmlId of the required object
     * @param id string htmlId of the required object
     * @return the hole category with each object or the required object or false
     */
    getGlobal: function(category, htmlId, id) {
        category = category || this.globalCat;
        if(window.userInterface) {
            category = window.userInterface[category];
        } else {
            return false;
        }

        //return each object of category if htmlId isn't set
        if(!htmlId && !id && category) {
            return category;
        }

        //get required object by id
        if(!htmlId && id && category) {
            var _object = false;
            for(var i in category) {
                if(category[i].id === id) {
                    _object = category[i];
                    break;
                }
            }

            return _object;
        }

        //otherwise return the required object
        else if(htmlId && category && category[htmlId]) {
            return category[htmlId];
        }

        //no results
        else return false;
    },

    /**
     * destroys this object
     * @param del boolean delete this object completely from memory
     */
    destroy: function(del) {
        //remove used htmlId
        this.removeHtmlId();
        
        //disconnects event handler
        this.deactivate({force: true});

        //remove node if exists
        dojo.destroy(this.htmlId);

        //unset global
        this.unsetGlobal();

        //delete this object
        if(del) delete this;
    },

    /**
     * creates an unique identifier
     * @param step integer
     * @param obscure boolean
     * @param id string
     * @returns {String} id
     */
    uniqueId: function(step, obscure, id) {
        //create new id storage
        if(!window.componentId) {
            window["componentId"] = {};
        }

        //if step isn't set but obscure
        if(typeof step == "boolean") {
            obscure = step;
            step = undefined;
        }

        //declare params
        obscure = (obscure === undefined) ? false : obscure;
        step = (step === undefined) ? 5 : step;
        var counter = 0;

        //remove each dot in class string and convert it to lower case
        var declaredClass;
        if(!id) {
            declaredClass = this.declaredClass.replace(/\./g, "");
            declaredClass = declaredClass.toLowerCase();
        } else {
            //use given id as unique id
            declaredClass = id;
        }

        //encrypt class string
        var uniqueId = "";

        if(obscure) {
            //obscure class name
            for(var n=0; n<declaredClass.length; n++) {
                //get char of each position
                var asciiChar = declaredClass.charCodeAt(n);
                //convert to another char and store it
                asciiChar += step;
                if(asciiChar > 122) asciiChar -= 26;
                asciiChar = String.fromCharCode(asciiChar);
                //create new unique string
                uniqueId += asciiChar;
            }
        } else {
            //use class name as unique id
            uniqueId = declaredClass;
        }

        //count each dom-element of this class
        dojo.query('*[id*="' + uniqueId + '"]').forEach(
            dojo.hitch(this, function() {
                //increment counter
                counter++;
            })
        );

        //create unique id
        uniqueId += counter;

        //test a second one for more obscuration
        var alreadyExists = 0;
        dojo.query('*[id*="' + uniqueId + '"]').forEach(
            dojo.hitch(this, function() {
                alreadyExists = true;
            })
        );

        //modify again if already exists
        if(alreadyExists) {
            uniqueId = this.uniqueId(step, obscure, uniqueId);
        }

        //store new htmlId
        uniqueId = this.storeHtmlId(uniqueId);

        //return unique id
        return uniqueId;
    },

    /**
     * stores the htmlId
     * @param id
     */
    storeHtmlId: function(id, idx) {
        var _id = id + (idx || "");
        idx = idx || 0;

        if(!window.componentId[_id]) {
            window.componentId[_id] = true;
        } else {
            _id = this.storeHtmlId(id, ++idx);
        }

        return _id;
    },

    /**
     * removes a html id
     * @param id
     */
    removeHtmlId: function(id) {
        id = id || this.htmlId;
        if(window.componentId[id])
            delete window.componentId[id];
    },

    /**
     * TODO: documentation
     * args: {
     *  name: string -> unique name of the event handler
     *  nodeId: string -> id of the source object
     *  event: string -> name of the event function like "onclick"
     *  context: object ->
     *  method: function ->
     *  lock: boolean -> if it is locked it can't deactivated
     * }
     * @param args
     */
    connect: function(args) {
        var name = args.name;
        var nodeId = args.nodeId;
        var event = args.event;
        var context = args.context;
        var method = args.method;
        var lock = args.lock || false;
        var body = args.body || false;

        //set context if it isn't set
        if(!context) context = this;

        //if name doesn't set use event as name
        if(!name) name = event;

        //if name already registered in this.connects or this.subscribes break
        if(this.subscribes[name] || this.connects[name]) return;
        //TODO log if an event-name is registered twice

        //create a new event handler
        this.connects[name] = {
            handler: dojo.connect(
                (dojo.hitch(this, function(){
                    if(body) return dojo.body();
                    else return dojo.byId(nodeId);
                }))(),
                event,
                context,
                method
            ),
            isActive: true,
            body: body,
            name: name,
            nodeId: nodeId,
            event: event,
            context: context,
            method: method,
            lock: lock
        };
    },

    /**
     * TODO: documentation
     * @param args
     * lock: boolean -> if it is locked it can't deactivated
     */
    subscribe: function(args) {
        var name = args.name;
        var event = args.event;
        var context = args.context;
        var method = args.method;
        var lock = args.lock || false;

        //set context if it isn't set
        if(!context) context = this;

        //if name doesn't set use event as name
        if(!name) name = event;

        //if name already registered in this.connects or this.subscribes break
        if(this.subscribes[name] || this.connects[name]) return;
        //TODO log if an event-name is registered twice

        //create a new event handler
        this.subscribes[name] = {
            handler: dojo.subscribe(event, dojo.hitch(context, method)),
            isActive: true,
            name: name,
            event: event,
            context: context,
            method: method,
            lock: lock
        };
    },

    /**
     * connects and subscribe each
     * registered event handler
     */
    activate: function(name) {
        this.isActivated = true;

        if(name && this.connects[name]) {
            //activate if it isn't active
            if(!this.connects[name].isActive) {
                //activate it
                this.connects[name].isActive = true;

                //create new event handler
                this.connects[name].handler = dojo.connect(
                    (dojo.hitch(this, function(){
                        if(this.connects[name].body) return dojo.body();
                        else return dojo.byId(this.connects[name].nodeId)
                    }))(),
                    this.connects[name].event,
                    this.connects[name].context,
                    this.connects[name].method
                );
            }
        } else if(name && this.subscribes[name]) {
            //activate if it isn't active
            if(!this.subscribes[name].isActive) {
                //activate it
                this.subscribes[name].isActive = true;

                //create new event handler
                this.subscribes[name].handler = dojo.subscribe(
                    this.subscribes[name].event,
                    dojo.hitch(
                        this.subscribes[name].context,
                        this.subscribes[name].method
                    )
                );
            }
        } else if(name) {
            //handler not found
            //TODO: log this error
            return;
        } else {
            //activate each inactive handler
            for(var handler in this.connects) {
                if(!this.connects[handler].isActive) {
                    //activate it
                    this.connects[handler].isActive = true;

                    //create new event handler
                    this.connects[handler].handler = dojo.connect(
                        (dojo.hitch(this, function(){
                            if(this.connects[handler].body) return dojo.body();
                            else return dojo.byId(this.connects[handler].nodeId)
                        }))(),
                        this.connects[handler].event,
                        this.connects[handler].context,
                        this.connects[handler].method
                    );
                }
            }

            //activate each inactive handler
            for(var handler in this.subscribes) {
                if(!this.subscribes[handler].isActive) {
                    //activate it
                    this.subscribes[handler].isActive = true;

                    //create new event handler
                    this.subscribes[handler].handler = dojo.subscribe(
                        this.subscribes[handler].event,
                        dojo.hitch(
                            this.subscribes[handler].context,
                            this.subscribes[handler].method
                        )
                    );
                }
            }
        }
        
    },

    /**
     * unsubscribes and disconnects
     * each registered event handler
     */
    deactivate: function(args) {
        if(!args) args = {};
        var name = args.name;
        var force = args.force || false;
        this.isActivated = false;
        
        if(name && this.connects[name]) {
            //disconnect specific handler
            if(!this.connects[name].lock || force) {
                //deactivate it
                this.connects[name].isActive = false;
                //disconnect it
                dojo.disconnect(this.connects[name].handler);
                this.connects[name].handler = null;
            }
        } else if(name && this.subscribes[name]) {
            //unsubscribe specific handler
            if(!this.subscribes[name].lock || force) {
                //deactivate it
                this.subscribes[name].isActive = false;
                //unsubscribe it
                dojo.unsubscribe(this.subscribes[name].handler);
                this.subscribes[name].handler = null;
            }
        } else if(name) {
            //handler not found
            //TODO: log this error
            return;
        } else {
            //disconnect each handler
            for(var cHandler in this.connects) {
                var isLocked = this.connects[cHandler].lock;
                if(!isLocked || force) {
                    //deactivate it
                    this.connects[cHandler].isActive = false;
                    //disconnect it
                    dojo.disconnect(this.connects[cHandler].handler);
                    this.connects[cHandler].handler = null;
                }
            }

            //unsubscribe each handler
            for(var handler in this.subscribes) {
                var isLocked = this.subscribes[handler].lock;
                if(!isLocked || force) {
                    //deactivate it
                    this.subscribes[handler].isActive = false;
                    //unsubscribe it
                    dojo.unsubscribe(this.subscribes[handler].handler);
                    this.subscribes[handler].handler = null;
                }
            }
        }
    },

    /**
     * hides this ui object
     * @param duration
     */
    hide: function(duration, nodeId, onEnd) {
        nodeId = nodeId || this.htmlId;
        duration = (typeof duration == "number") ? duration : 500;

        //fade ui object out
        this.fade({
            duration: duration,
            nodeId: nodeId,
            start: 1,
            end: 0,
            onEnd: dojo.hitch(this, function() {
                dojo.style(nodeId, "display", "none");
                this.isVisible = false;
                if(onEnd) onEnd();
            })
        });
    },

    /**
     * fades this ui object
     * in if it is invisible
     * @param duration
     */
    show: function(duration, nodeId, onEnd) {
        nodeId = nodeId || this.htmlId;
        duration = (typeof duration == "number") ? duration : 500;

        //fade ui object in
        this.fade({
            duration: duration,
            nodeId: nodeId,
            start: 0,
            end: 1,
            onBegin: dojo.hitch(this, function() {
                dojo.style(nodeId, "display", "");
                this.isVisible = true;
            }),
            onEnd: dojo.hitch(this, function() {
                if(onEnd) onEnd();
            })
        });
    },

    /**
     * fades a node in or out
     * args = {
     *      duration: integer
     *      start: integer opacity on animation start
     *      end: integer opacity on animation end
     *      nodeId: string default is this.htmlId if not set
     * }
     * 
     * @param args object
     */
    fade: function(args) {
        var duration = (typeof args.duration == "number") ? args.duration : 0;
        var start = (typeof args.start == "number") ? args.start : 0;
        var end = (typeof args.end == "number") ? args.end : 1;
        var nodeId = args.nodeId || this.htmlId;
        var onBegin = args.onBegin || function(){};
        var onEnd = args.onEnd || function(){};
        var node = dojo.byId(nodeId);

        //animate fade animation
        if(node) dojo.animateProperty({
            node: nodeId,
            duration: duration,
            onBegin: onBegin,
            onEnd: onEnd,
            properties: {
                opacity: {
                    start: start,
                    end: end
                }
            }
        }).play();
    },

    /**
     * sets the position
     * @param x integer
     * @param y integer
     */
    setPosition: function(x, y) {
        this.x = x || this.x || 0;
        this.y = y || this.y || 0;
        var node = dojo.byId(this.htmlId);

        dojo.style(node, "left", this.x + "px");
        dojo.style(node, "top", this.y + "px");
    },

    /**
     * tests whether the given node
     * is a specific ui type
     * @param node
     * @param type
     */
    isUiType: function(node, type) {
        type = type || this.uiType;
        //max search iterations
        var maxSearchLoops = 10;
        var curSearchLoops = 0;
        var isType = false;
        var uiType = null;

        //search ui type of the given node
        while(!uiType && curSearchLoops < maxSearchLoops && node) {
            //get uitype property of the current node
            uiType = dojo.getNodeProp(node, "uitype");
            //get next parent node if no type is found
            if(uiType != type) node = node.parentNode;
            //otherwise get the nodes id
            else isType = true;
            //increment loop counter
            curSearchLoops++;
        }

        return isType;
    },

    /**
     * gets the origin of this object in
     * relation to the window object
     * @return {
     *  x: integer,
     *  y: integer
     * }
     */
    getOrigin: function() {
        var node = dojo.byId(this.htmlId);
        var width = dojo.style(node, "width");
        var height = dojo.style(node, "height");
        var winHeight = 0, winWidth = 0;

        //TODO implement air
        if(air) {
            winWidth = window.nativeWindow.stage.stageWidth;
            winHeight = window.nativeWindow.stage.stageHeight;
        } else if(window) {
            winHeight = window.innerHeight;
            winWidth = window.innerWidth;
        }

        return {
            x: winWidth/2 - width/2,
            y: winHeight/2 - height/2
        }
    },

    /**
     * gets the size of this ui object
     * @param id string id of a DOM element
     */
    getSize: function(id) {
        id= id || this.htmlId;
        var node = dojo.byId(id);

        return {
            w: dojo.style(node, "width"),
            h: dojo.style(node, "height")
        }
    }
});
