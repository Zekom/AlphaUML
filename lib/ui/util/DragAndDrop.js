/**
 * User: Christoph Grundmann
 * Date: 17.05.11
 * Time: 22:24
 *
 */
dojo.provide("ui.util.DragAndDrop");
dojo.require("ui.Object");
dojo.require("ui.Tab");

dojo.declare("ui.util.DragAndDrop", ui.Object, {
    isDragged: null,
    isDragging: null,
    movable: null,
    handle: null,
    onMove: null,
    onStart: null,
    onStop: null,
    tag: null,
    obj: null,

    //static vars
    static: {active:false},

    /**
     * handle string id of the node that will be used as a handle
     * movable ui.Object object that will be movable
     * @param args
     */
    constructor: function(args) {
        this.movable = args.movable;
        this.handle = args.handle;
        this.onMove = args.onMove;
        this.onStart = args.onStart;
        this.onStop = args.onStop;

        //create a new tag
        this.tag = new ui.util.DragAndDropTag({
            offsetX: 0,
            offsetY: 20
        });

        //create dnd object
        this.create();

        //set drag and drop functionality
        this.connect({
            name: "Start",
            nodeId: this.handle,
            event: "onmousedown",
            lock: true,
            method: this.start
        });

        this.connect({
            name: "Stop",
            body: true,
            event: "onmouseup",
            lock: true,
            method: this.stop
        });

        this.connect({
            name: "Move",
            body: true,
            event: "onmousemove",
            lock: true,
            method: this.move
        });
    },

    /**
     * destroys this dnd object
     * @param del
     */
    destroy: function(del) {
        this.tag.destroy();
        this.inherited(arguments);
    },

    /**
     * starts dragging
     * @param mouse mouseEvent
     */
    start: function(mouse) {
        //dnd is active
        this.static.active = true;

        //add dnd class
        dojo.addClass(dojo.body(), "dnd");

        //TODO shouldn't execute in start() move it to move()
        //hides tab
        /* this.movable.fade({
            duration: 100,
            start: 1,
            end: 0.3
        }); */

        //enable dragging
        this.isDragging = true;
    },

    /**
     * stops dragging
     * @param mouse mouseEvent
     */
    stop: function(mouse) {
        //disable dragging
        this.isDragging = false;

        //show tab
        this.movable.fade({
            duration: 0,
            start: 0.3,
            end: 1
        });

        //get ui object of the hovered dom node
        var obj = this.getObject(mouse.target);

        //if hovered object is a tab
        if(obj && this.isDragged) {
            //handle different kinds of ui types
            if(obj.uiType == "tab") this.handleTab(obj);
            else if(obj.uiType == "tabbar") this.handleTabBar(obj);
            else if(obj.uiType == "frame") this.handleFrame(obj);

            //deactivate dragged state
            this.isDragged = false;
        }

        //destroy tag
        this.tag.destroy();

        //remove dnd class
        dojo.removeClass(dojo.body(), "dnd");

        //dnd is inactive
        this.static.active = false;
    },

    /**
     * handler during the dragging
     * @param mouse
     */
    move: function(mouse) {
        if(this.isDragging) {
             //add the tag if necessary
            this.tag.place(this.movable.title);

            //set tag position
            this.tag.position(mouse.clientX, mouse.clientY);

            //object is dragged
            this.isDragged = true;
        }
    },

    /**
     * gets ui object of the
     * given node
     * @param node
     * @return ui.Object
     */
    getObject: function(node) {
        //max search iterations
        var maxSearchLoops = 10;
        var curSearchLoops = 0;
        var nodeId = null;
        var uiType = null;

        //search ui type of the given node
        while(!uiType && curSearchLoops < maxSearchLoops && node) {
            //get uitype property of the current node
            uiType = dojo.getNodeProp(node, "uitype");
            //get next parent node if no type is found
            if(!uiType) node = node.parentNode;
            //otherwise get the nodes id
            else nodeId = node.id;
            //increment loop counter
            curSearchLoops++;
        }

        //return found ui object
        return this.getGlobal(uiType, nodeId);
    },

    /**
     * tab was dropped on another tab
     * @param obj
     */
    handleTab: function(obj) {
        //get parent frame of the tab
        var frame = this.getGlobal("frame", obj.frameId);

        //replace tab node
        this.movable.place(frame, obj.placementIndex);
    },

    /**
     * tab was dropped on a tab bar
     * @param obj
     */
    handleTabBar: function(obj) {
        //get parent frame of the tab
        var frame = this.getGlobal("frame", obj.frameId);

        //TODO display hover border of the last tab in this frame

        //replace tab node
        this.movable.place(frame);
    },

    /**
     * tab was dropped on a frame
     * @param obj
     */
    handleFrame: function(obj) {
        //replace tab node
        this.movable.place(obj);
    }
});

/**
 * a small info tag that will shown at dragging.
 * shows the name of the current dragged tab in
 * the near of the mouse pointer.
 */
dojo.declare("ui.util.DragAndDropTag", ui.Object, {
    offsetX: null,
    offsetY: null,
    
    constructor: function(args) {
        this.offsetX = args.offsetX;
        this.offsetY = args.offsetY;

        //create htmlId
        this.create();
    },

    /**
     * places tag into the body if
     * it isn't already created
     * @param title string
     */
    place: function(title) {
        //get tag node
        var node = dojo.byId(this.htmlId);

        //create tag if doesn't exists
        if(!node) dojo.place(
            '<div class="dndTag" id="' + this.htmlId + '">' + title + '</div>',
            dojo.body()
        );
    },

    /**
     * sets the position of the tag
     * @param x integer
     * @param y integer
     */
    position: function(x, y) {
        //get tag node
        var node = dojo.byId(this.htmlId);

        //set absolute position
        dojo.style(node, "left", (this.offsetX + x) + "px");
        dojo.style(node, "top", (this.offsetY + y) + "px");
    }
});
