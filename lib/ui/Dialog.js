/**
 * User: Christoph Grundmann
 * Date: 30.06.11
 * Time: 13:52
 *
 */
dojo.provide("ui.Dialog");
dojo.require("ui.Object");

dojo.declare("ui.Dialog", ui.Object, {
    isSelected: null,
    hasTable: null,
    title: null,
    dnd: null,

    onCancel: null,
    onApprove: null,
    onSelect: null,
    onDestroy: null,

    titleId: null,
    closeBtnId: null,
    cancelBtnId: null,
    okBtnId: null,
    bodyId: null,
    tableId: null,
    previewId: null,

    constructor: function(args) {
        args = args || {};
        this.title = args.title;
        this.onSelect = args.onSelect;
        this.onApprove = args.onApprove || this.onApprove;
        this.onDestroy = args.onDestroy;
        this.placeAt = this.placeAt || "main";
        this.uiType = "dialog";
        this.x = args.x;
        this.y = args.y;
    },

    create: function() {
        this.inherited(arguments);

        //create ids
        this.titleId = this.htmlId + "Title";
        this.closeBtnId = this.htmlId + "CloseBtn";
        this.cancelBtnId = this.htmlId + "CancelBtn";
        this.okBtnId = this.htmlId + "OkBtn";
        this.bodyId = this.htmlId + "Body";
        this.headerId = this.htmlId + "Header";

        //place dialog
        dojo.place(
            '<div class="Dialog" uitype="' + this.uiType + '" style="opacity: 0; display: none;" id="' + this.htmlId + '">' +
                '<div class="inner">' +
                    '<div class="header" id="' + this.headerId + '">' +
                        '<div class="title" id="' + this.titleId + '"></div>' +
                        '<div class="close" id="' + this.closeBtnId + '"></div>' +
                    '</div>' +
                    '<div class="body" id="' + this.bodyId + '"></div>' +
                    '<div class="footer">' +
                        '<div class="execButton left" id="' + this.cancelBtnId + '">Cancel</div>' +
                        '<div class="execButton right" id="' + this.okBtnId + '">OK</div>' +
                    '</div>' +
                '</div>' +
            '</div>',
            dojo.byId(this.placeAt)
        );

        //set up dialog
        this.setTitle(this.title);

        this.connect({
            name: "CloseBtn",
            event: "onclick",
            nodeId: this.closeBtnId,
            method: function(event) {
                dojo.stopEvent(event);
                this.close();
            }
        });

        this.connect({
            name: "CancelBtn",
            event: "onclick",
            nodeId: this.cancelBtnId,
            method: function(event) {
                dojo.stopEvent(event);
                //if(this.onCancel) this.onCancel(event);
                this.close();
            }
        });

        this.connect({
            name: "OkBtn",
            event: "onclick",
            nodeId: this.okBtnId,
            method: function(event) {
                dojo.stopEvent(event);
                if(this.onApprove) this.onApprove(event);
                this.close();
            }
        });

        this.connect({
            name: "KeyBoard",
            event: "onkeyup",
            body: true,
            method: function(event) {
                if(this.isSelected) {               
                    //enter key
                    if(event.keyCode == 13) {
                        dojo.stopEvent(event);
                        if(this.onApprove) this.onApprove(event);
                        this.close();
                    }

                    //escape key
                    if(event.keyCode == 27) {
                        dojo.stopEvent(event);
                        this.close();
                    }
                }
            }
        });

        //select dialog
        this.connect({
            name: "SelectDialog",
            event: "onclick",
            nodeId: this.htmlId,
            method: function() {
                //if(!this.isSelected) {
                    this.select(true);
                //}
            }
        });

        //deselect dialog
        this.connect({
            name: "DeselectDialog",
            event: "onclick",
            body: true,
            method: function(event) {
                if(this.isSelected && !this.isUiType(event.target)) {
                    this.select(false);
                }
            }
        });

        //deselect dialog if another is activated
        this.subscribe({
            event: "DialogSelected",
            method: function(id) {
                if(this.htmlId != id && this.isSelected) {
                    this.select(false);
                }
            }
        });

        //make dialog draggable
        this.dnd = dojo.dnd.Moveable(this.htmlId, {
            handle: this.headerId
        });

        //select class on first move
        this.dnd.onFirstMove = dojo.hitch(this, function() {
            this.select(true);
        });

        //open dialog
        this.open();

        //set initial position
        if(!this.x && !this.y) {
            var origin = this.getOrigin();
            this.x = origin.x;
            this.y = origin.y;
        }
        this.setPosition(this.x, this.y);
    },

    /**
     * destroys the dialog
     * @param del boolean
     */
    destroy: function(del) {
        this.inherited(arguments);
        if(this.onDestroy) this.onDestroy();
    },

    /**
     * opens the dialog
     */
    open: function() {
        this.show();
        this.select(true);
    },

    /**
     * closes the dialog
     */
    close: function() {
        //fade ui object out
        this.fade({
            duration: 500,
            nodeId: this.htmlId,
            start: 1,
            end: 0,
            onEnd: dojo.hitch(this, function() {
                this.isVisible = false;
                this.destroy(true);
            })
        });
    },

    setTitle: function(title) {
        this.title = title || this.title || "";

        var node = dojo.byId(this.titleId);
        node.innerHTML = this.title;
    },

    /**
     * selects or deselects the class
     * @param select boolean if it is set to false class will be deactivated
     */
    select: function(select) {
        //get class node
        var node = dojo.byId(this.htmlId);

        //select dialog
        if(select) {
            this.isSelected = true;
            dojo.addClass(node, "selected");
            dojo.style(node, "zIndex", 250);
            if(this.onSelect) this.onSelect();
            dojo.publish("DialogSelected", [this.htmlId]);
        }

        //deselect dialog
        else {
            dojo.removeClass(node, "selected");
            dojo.style(node, "zIndex", 200);
            this.isSelected = false;
        }
    },

    /**
     * adds new content into the dialog
     * @param title string
     * @param content string
     * @param id string place id
     */
    addContent: function(title, content, id) {
        var nodeId = id || this.bodyId;

        //place new content
        dojo.place(
            '<div class="content">' +
                '<div class="cntHeader">' + title + '</div>' +
                '<div class="cntBody">' + content + '</div>' +
            '</div>',
            dojo.byId(nodeId)
        );
    },

    /**
     * TODO create specific class for adding class diagram elements?
     * adds a table view with an optional preview area
     *
     * rows: [
     *   {
     *      id: "idAsString",
     *      html: "html string"
     *   }
     * ]
     *
     * @param rows array of rows
     * @param preview html string
     */
    addTableView: function(rows, preview) {
        //create ids if necessary
        if(!this.tableId) this.tableId = this.htmlId + "Table";
        if(!this.previewId) this.previewId = this.htmlId + "Preview";

        //add table with preview area
        dojo.place(
            '<div class="preview" style="display: none;" id="' + this.previewId + '"></div>' +
            '<div class="table" id="' + this.tableId + '"></div>',
            dojo.byId(this.bodyId)
        );

        //register table
        this.hasTable = true;

        //add rows
        dojo.forEach(rows, dojo.hitch(this, function(row) {
            var rowHTML = row.html || "";
            dojo.place('<div class="row" id="' + row.id + '">' + rowHTML + '</div>', this.tableId);
        }));

        //add preview
        if(preview) {
            this.createPreviewArea(preview);
        }
    },

    /**
     * adds a single row to a existing table
     * or creates a new one if it doesn't created before
     *
     * row: {
     *   id: "idAsString",
     *   html: "html string"
     * }
     * @param row object
     */
    addTableRow: function(row) {
        //add new row
        if(this.hasTable) {
            var rowHTML = row.html || "";
            dojo.place('<div class="row" id="' + row.id + '">' + rowHTML + '</div>', this.tableId);
        }

        //otherwise create a new one
        else this.addTableView([row]);
    },

    /**
     * adds new preview area to an existing table or
     * creates a new tabe if doesn't exists already
     * @param preview html string
     */
    addTablePreview: function(preview) {
        //add new preview area
        if(this.hasTable) {
            this.createPreviewArea(preview);
        }

        //otherwise create a new table
        else this.addTableView([], preview);
    },

    /**
     * creates preview area
     */
    createPreviewArea: function(preview) {
        //get preview node
        var previewArea = dojo.byId(this.previewId);

        //show preview area
        dojo.style(previewArea, "display", "");

        //place preview html
        dojo.place(preview, previewArea);

        //listen for size changes
        this.subscribe({
            event: "PreviewUpdate",
            method: function() {
                //calculate and set left margin -> center preview
                var previewSize = this.getSize(this.previewId);
                dojo.query("#" + this.previewId + " .row").forEach(
                    dojo.hitch(this, function(row) {
                        var rowWidth = row.clientWidth;
                        var marginLeft = previewSize.w/2 - rowWidth/2;
                        dojo.style(row, "marginLeft", marginLeft + "px");
                    })
                );
            }
        });
    },

    /**
     * hides the OK button
     */
    hideOkButton: function() {
        this.hide(0, this.okBtnId);
    },

    /**
     * hides the cancel button
     */
    hideCancelButton: function() {
        this.hide(0, this.cancelBtnId);
    }
});
