/**
 * registers events (mostly click events) for the frontend
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
var FrontendEvents = Class.extend({

    /**
     * the current backend
     */
    backend: false,


    /**
     * the current backend helpers
     */
    backendHelpers: false,


    /**
     * the current frontend
     */
    frontend: false,


    /**
     * the current frontend helpers
     */
    frontendHelpers: false,


    /**
     * the jcrop selection
     */
    selection: false,


    /**
     * initialize events (clicks, ...)
     * @param backend (object) the current backend
     * @param backendHelpers (object) the helpers of backend
     * @param frontend (object) the current frontend
     * @param frontendHelpers (object) the helpers of frontend
     */
    initAllEvents: function(backend, backendHelpers, frontend, frontendHelpers) {
        var that = this;

        // save instances for later use
        this.backend = backend;
        this.frontend = frontend;
        this.frontendHelpers = frontendHelpers;
        this.backendHelpers = backendHelpers;

        // initialize window resize handler
        $(window).bind("resize", function() {
            that.resize();
        });
        this.resize();

        // open external links in new window
        $('body').delegate("a.extern", "click", function(e) {
            gui.Shell.openExternal($(this).attr('href'));
            e.preventDefault();
            return false;
        });

        // close menues when clicking somewhere
        $('body').click(function(event) {
            // no click inside main menue: close it
            if ($(event.target).parents('#main-menue-dropdown').length===0 && event.target.id != 'main-menue' && event.target.id != 'fileDialog') {
                $('#main-menue-dropdown li').show();
                $('#main-menue-avatar-croper, #main-menue-dropdown').hide();
            }

            // no click inside add menue: close it
            if ($(event.target).parents('#message-add-menue-dropdown').length===0 && event.target.id != 'message-add-menue')
                $('#message-add-menue-dropdown').hide();

            // no click inside add code box: close it
            if ($(event.target).parents('#message-add-code-box, #message-add-menue-dropdown').length===0 && event.target.id != 'message-add-menue') {
                $('#message-add-code-box').hide();
                $('#message-add-code-box-area').val('');
            }
        });

        // menue: toggle
        $('#main-menue').click(function() {
            $('#main-menue-dropdown').toggle();
        });

        // menue: select avatar
        $('#main-menue-avatar').click(function() {
            that.selectAvatar();
        });

        // menue: save avatar
        $('#main-menue-avatar-croper .save').click(function() {
            if (that.selection===false) {
                alertify.error('Bitte einen sichtbaren Bereich w&auml;hlen');
                return;
            }
            $('#main-menue-dropdown li').show();
            $('#main-menue-avatar-croper').hide();

            var image = frontendHelpers.cropAndResize(
                $('#main-menue-avatar-croper img')[0],
                that.selection.x,
                that.selection.y,
                that.selection.w,
                that.selection.h);

            backend.saveAvatar(image);
            $('#main-menue-dropdown').hide();
            backend.updateUserlist(frontend.currentConversation);
        });

        // menue: cancel avatar
        $('#main-menue-avatar-croper .cancel').click(function() {
            $('#main-menue-dropdown li').show();
            $('#main-menue-avatar-croper').hide();
            $('#main-menue-dropdown').hide();
        });

        // menue: notification status
        $('#main-menue-status').click(function() {
            if($(this).hasClass('inactive')) {
                $(this).removeClass('inactive');
                backend.notifications(true);
            } else {
                $(this).addClass('inactive');
                backend.notifications(false);
            }
            $('#main-menue-dropdown').hide();
        });

        // menue: about
        $('#main-menue-quit').click(function() {
            backend.quit();
        });

        // menue: about
        $('#main-menue-about').click(function() {
            gui.Shell.openExternal('http://www.sum-messenger.org');
            $('#main-menue-dropdown').hide();
        });

        // close
        $('#main-close').click(function() {
            backend.close();
        });

        // message-add-menue: toggle
        $('#message-add-menue').click(function() {
            $('#message-add-menue-dropdown').toggle();
        });

        // message-add-menue-code
        $('#message-add-menue-code').click(function() {
            that.showCodeBox();
        });

        // send file
        $('#message-add-menue-file').click(function() {
            alertify.error('Diese Funktion ist noch nicht implementiert');
        });

        // menue: send code block
        $('#message-add-code-box-send').click(function() {
            // code given?
            if ($('#message-add-code-box-area').val().trim().length===0) {
                alertify.error('bitte eine Nachricht eingeben');
                return;
            }

            // chat channel selected?
            if (frontend.currentConversation===false) {
                alertify.error('bitte einen Chat Kanal ausw&auml;hlen');
                return;
            }

            var language = $('#message-add-code-box-language').val();
            var message = '[code language=' + language + '] ' + $('#message-add-code-box-area').val() + ' [/code]';

            // send message
            $('#message-add-code-box').hide();
            $('#message-add-code-box-area').val('');
            backend.sendMessage(frontend.currentConversation, message);
        });

        // menue: cancel code block
        $('#message-add-code-box-cancel').click(function() {
            $('#message-add-code-box').hide();
            $('#message-add-code-box-area').val('');
        });

        // toggle emoticons
        $('#message-toggleemots').click(function() {
            var emoticonsPopup = $('#message-emoticons');
            $(this).toggleClass('active');
            if($(this).hasClass('active')) {
                emoticonsPopup.css('marginTop', -1 * emoticonsPopup.height() - parseInt(emoticonsPopup.css('padding')));
                emoticonsPopup.show();
            } else  {
                emoticonsPopup.hide();
            }
        });

        // emoticons click
        $('#message-emoticons').delegate("img", "click", function() {
            $('#message-input-textfield').val(
                $('#message-input-textfield').val() + " " + $(this).attr('title')
            );
            $('#message-toggleemots').click();
            $('#message-input-textfield').focus();
        });

        // select user
        $('.contacts').delegate("li", "click", function() {
            var user = $(this).find('.contacts-name').html();
            $('.rooms li, .contacts li').removeClass('active');
            $(this).addClass('active');
            frontend.currentConversation = user;
            backend.getConversation(user);
            backend.updateUserlist(frontend.currentConversation);
            $('#main-metadata').css('visibility', 'visible');
        });

        // select room
        $('.rooms').delegate("li", "click", function() {
            if ( $(this).find('.rooms-outside').length>0 ) {
                alertify.error('Bitte erst Einladung annehmen/ablehnen');
                return;
            }
            var room = $(this).find('.name').html();
            $('.rooms li, .contacts li').removeClass('active');
            $(this).addClass('active');
            frontend.currentConversation = room;
            backend.getConversation(frontend.currentConversation);
            backend.updateUserlist(frontend.currentConversation);
            $('#main-metadata').css('visibility', 'visible');
        });

        // send message
        $('#message-send').click(function() {
            var message = $('#message-input-textfield').val();

            // message given?
            if (message.trim().length===0) {
                alertify.error('bitte eine Nachricht eingeben');
                return;
            }

            // chat channel selected?
            if (frontend.currentConversation===false) {
                alertify.error('bitte einen Chat Kanal ausw&auml;hlen');
                return;
            }

            // send message
            $('#message-input-textfield').val("");
            backend.sendMessage(frontend.currentConversation, message);
        });

        // send message by enter
        $('#message-input-textfield').keypress(function(e) {
            if(e.which == 13) {
                $('#message-send').click();
            }
        });

        // rooms add: show dialog
        $('#rooms-add').click(function() {
            that.showAddRoomsDialog(this);
        });

        // rooms add: cancel
        $('body').delegate(".rooms-popup.add .cancel", "click", function(e) {
            $('.rooms-popup.add').remove();
        });

        // rooms add: save
        $('body').delegate(".rooms-popup.add .save", "click", function(e) {
            var room = $(this).parent().find('.name').val();
            var users = $(this).parent().find('select').val();

            // room name given?
            if($.trim(room).length===0) {
                alertify.error('Bitte einen Namen für den Raum angeben');
                return;
            }

            // don't add room with same name
            if(backend.doesRoomExists(room)) {
                alertify.error('Raum mit dem Namen existiert bereits');
                return;
            }

            // don't add room of name of a user
            if(backend.getUser(room)!==false) {
                alertify.error('Es existiert bereits ein Benutzer mit diesem Namen');
                return;
            }

            // add room
            backend.addRoom(room, users);

            // hide popup
            $('.rooms-popup.add').remove();
            alertify.log('Raum erfolgreich erstellt');
        });

        // rooms invitation: accept
        $('body').delegate(".rooms-popup.invite .save", "click", function(e) {
            var room = $(this).parent().find('.name').val();
            backend.acceptInvitation(room);
            $(this).parent().remove();
        });

        // rooms invitation: decline
        $('body').delegate(".rooms-popup.invite .cancel", "click", function(e) {
            var room = $(this).parent().find('.name').val();
            backend.declineInvitation(room);
            $(this).parent().remove();
        });

        // rooms: invite user
        $('.rooms').delegate("li .rooms-invite", "click", function() {
            that.showInviteRoomsDialog(this);
        });

        // rooms: invite user save
        $('body').delegate(".rooms-popup.edit .save", "click", function(e) {
            var room = $(this).parent().find('.name').val();
            var users = $(this).parent().find('select').val();

            backend.inviteUsers(room, users);

            $('.rooms-popup.edit').remove();
            alertify.log('Einladungen versendet');
        });

        // rooms: invite user cancel
        $('body').delegate(".rooms-popup.edit .cancel", "click", function(e) {
            $('.rooms-popup.edit').remove();
        });

        // rooms: leave
        $('.rooms').delegate("li .rooms-leave", "click", function(e) {
            var room = $(this).parent().find('.name').html();
            backend.leaveRoom(room);
            $('.rooms li:first').click();
            e.preventDefault();
            return false;
        });
    },


    /**
     * select new avatar
     * @param evt (object) event
     */
    selectAvatar: function(evt) {
        var that = this;
        $('#fileDialog').change(function(evt) {
            // check file given?
            if ($(this).val() === '')
                return;

            // show cropper
            $('#main-menue-dropdown li').hide();
            $('#main-menue-avatar-croper').show();

            // load file
            var file = $(this).val();
            $(this).val('');
            that.backendHelpers.readFile(
                file,
                function(data) {
                    // check filetype
                    var filetype = file.split('.').pop();
                    if (filetype != "png" && filetype != "jpg" && filetype != "gif") {
                        alertify.error("Bitte PNG, JPG oder GIF Datei w&auml;hlen");
                        $('#main-menue-avatar-croper .cancel').click();
                        return;
                    }

                    // init jCrop
                    $('#main-menue-avatar-croper *:not(input)').remove();
                    $('#main-menue-avatar-croper').prepend('<img />');
                    $('#main-menue-avatar-croper img').attr('src', 'data:image/' + filetype + ';base64,' + data.toString('base64'));
                    that.frontendHelpers.resizeImage($('#main-menue-avatar-croper img'), 200, 200);
                    that.selection = false;

                    var img = $('#main-menue-avatar-croper img');
                    var max = img.width()>img.height() ? img.height() : img.width();
                    $('#main-menue-avatar-croper img').Jcrop({
                        onSelect: function(c) {
                            that.selection = c;
                        },
                        setSelect: [max*0.1, max*0.1, max*0.9, max*0.9],
                        aspectRatio: 1
                    });
                },
                alertify.error
            );
        });
        $('#fileDialog').trigger('click');
    },


    /**
     * show add room dialog popup
     */
    showAddRoomsDialog: function(element) {
        // remove existing popups
        $('.rooms-popup.add, .rooms-popup.edit').remove();

        // create select with all users
        var select = this.createSelectForAllUsers();

        // create popup with text and buttons
        var div = $(this.frontendHelpers.createRoomsPopup(element, "add"));
        div.append('<input type="text" class="name selectize-input" placeholder="Name des Raums">');
        div.append(select);
        div.append('<input class="save" type="button" value="speichern" /> <input class="cancel" type="button" value="abbrechen" />');

        // make user select selectize.js
        $(select).selectize({plugins: ['remove_button']});
    },


    /**
     * shows the invite more users dialog
     */
    showInviteRoomsDialog: function(element) {
        var room = $(element).parent().find('.name').html();

        // create select with all users
        var select = this.createSelectForAllUsers();

        // create popup with text and buttons
        var div = $(this.frontendHelpers.createRoomsPopup($('#rooms-add'), "edit"));
        div.append('<p>Weitere Mitglieder in Gruppe einladen:</p>');
        div.append('<input class="name" type="hidden" value="' + room.escape() + '" />');
        div.append(select);
        div.append('<input class="save" type="button" value="einladen" /> <input class="cancel" type="button" value="abbrechen" />');

        // make user select selectize.js
        $(select).selectize({plugins: ['remove_button']});
    },


    /**
     * create a select input for all users
     */
    createSelectForAllUsers: function() {
        // get all users from backend
        var users = this.backend.getAllUsers(true);

        // create select with all users
        var select = document.createElement("select");
        select.setAttribute('placeholder', 'Mitglieder...');
        select.setAttribute('multiple', 'multiple');
        for (var i=0; i<users.length; i++) {
            var option = document.createElement("option");
            option.setAttribute('value', users[i]);
            option.innerHTML = users[i];
            select.appendChild(option);
        }

        return select;
    },


    /**
     * show codeBox with textarea for code
     */
    showCodeBox: function() {
        $('#message-add-menue-dropdown').hide();
        $('#message-add-code-box').show();
    },


    /**
     * set automatically the height of the tags and set scrollbar for div scrolling
     */
    resize: function() {
        var start = $('#contacts-wrapper').position().top;
        var windowHeight = $(window).height();
        var roomsHeight = $('#rooms').outerHeight();
        $('#contacts-wrapper').height(windowHeight - start - roomsHeight);
        $("#contacts-wrapper").mCustomScrollbar("update");
        $('#contacts-wrapper').show();

        var headerHeight = $('#main-header').outerHeight();
        var messageHeight = $('#message').outerHeight();
        var padding = parseInt($('#content').css('padding-bottom')) * 2;

        $('#content-wrapper').height(windowHeight - headerHeight - messageHeight - padding);

        // set new position for rooms popups
        var diff = windowHeight - this.frontend.lastWindowHeight;
        this.frontend.lastWindowHeight = windowHeight;
        $('.rooms-popup').each(function(index, item) {
            $(item).css('top', parseInt($(item).css('top')) + diff);
        });
    }
});