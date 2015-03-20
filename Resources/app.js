// create and set menu
var menu     = Ti.UI.createMenu(),
    fileItem = Ti.UI.createMenuItem('File'),
    exitItem = fileItem.addItem('Exit', function () {
	    if (confirm('Are you sure you want to quit?')) Ti.App.exit();
    });

menu.appendItem(fileItem);
Ti.UI.setMenu(menu);

$(function () {
	var body     = $('body');
	var response = null;
	var path     = getPath();

	if (path !== undefined) {
		$('#skypePath').val(path);

		response = getFromSkypeDb(path);
		var data = usersHtml(response);

		$('#userGroup').html(data);

		// remove readOnly
		var skypeDir = Ti.Filesystem.getFile(path, 'main.db');
		skypeDir.setWritable();

	} else {
		$('#myTab a:last').tab('show');
	}

	$('#saveSkypePathHelp').on('click', function () {
		alert('ex: C:\\Users\\[computer user]\\AppData\\Roaming\\Skype\\[skype user]');
		return false;
	});

	body.on('click', '.user', function () {
		clickOnUser($(this), response, path);
	});

	body.on('click', '.remove', function () {
		removeUserComment($(this), path);
	});

	$('#saveSkypePath').on('click', function () {
		var path = $('#skypePath').val();
		if (path === '') {
			alert('The path is empty');
			return false;
		}

		if (path !== '') {
			var skypeDir = Ti.Filesystem.getFile(path, 'main.db');

			if (skypeDir.exists(path)) {
				insertDefaults(path);
			} else {
				alert('The path is invalid');
				return false;
			}
		}
	});
});

function removeUserComment(that, path) {
	var id = that.data('id');

	removeComment(path, id);

	$('body').find('#list-' + id).remove();
}

function clickOnUser(that, response, path) {
	var id        = that.data('id');
	var messageId = response[id].id;

	var resp = getMessagesFromSkypeDb(path, messageId);
	var data = messageHtml(resp);

	var userInfo = $('#userInfo');
	userInfo.html(data);
	userInfo.scrollTop(userInfo.prop("scrollHeight"));

	return false;
}

function messageHtml(response) {
	var data = '';
	for (var i = 0; i <= response.length; i++) {
		if (response[i] !== undefined) {
			if (response[i].body_xml !== '') {

				var obj = {
					body_xml : response[i].body_xml,
					author   : response[i].author,
					timestamp: getTime(response[i].timestamp),
					id       : response[i].id
				};

				if (response[i].dialog_partner !== '' && (response[i].author === response[i].dialog_partner)) data += leftChat(obj);
				if (response[i].dialog_partner === '') data += leftChat(obj);
				if (response[i].dialog_partner !== '' && (response[i].author !== response[i].dialog_partner)) data += rightChat(obj);
			}
		}
	}

	return data;
}

function getTime(time) {
	var date    = new Date(time * 1000);
	var hours   = date.getHours();
	var minutes = "0" + date.getMinutes();
	var seconds = "0" + date.getSeconds();

	return date.getMonth() + '-' + date.getDate() + '-' + date.getFullYear() + ' ' + hours + ':' + minutes.substr(minutes.length - 2) + ':' + seconds.substr(seconds.length - 2);
}

function usersHtml(response) {
	var data = '';
	for (var i = 0; i <= response.length; i++) {
		if (response[i] !== undefined) {
			data += '<a href="#" data-id="' + i + '" class="list-group-item user">' + response[i].displayname + '</a>';
		}
	}

	return data;
}

function getMessagesFromSkypeDb(path, messageId) {
	var db    = Ti.Database.openFile(Ti.Filesystem.getFile(path, 'main.db'));
	var rows  = db.execute("SELECT * FROM Messages WHERE convo_id = " + messageId);
	var array = [];
	while (rows.isValidRow()) {
		array.push({
			id            : rows.fieldByName('id'),
			author        : rows.fieldByName('author'),
			dialog_partner: rows.fieldByName('dialog_partner'),
			timestamp     : rows.fieldByName('timestamp'),
			body_xml      : rows.fieldByName('body_xml')
		});
		rows.next();
	}

	rows.close();
	db.close();

	return array;
}

function removeComment(path, id) {
	var db = Ti.Database.openFile(Ti.Filesystem.getFile(path, 'main.db'));
	db.execute("DELETE FROM Messages WHERE id = " + id);
	alert('Comment removed successfully');
	db.close();
}


function getFromSkypeDb(path) {
	var db    = Ti.Database.openFile(Ti.Filesystem.getFile(path, 'main.db'));
	var rows  = db.execute("SELECT * FROM Conversations WHERE inbox_timestamp IS NOT NULL ORDER BY inbox_timestamp DESC");
	var array = [];
	while (rows.isValidRow()) {
		array.push({
			id         : rows.fieldByName('id'),
			displayname: rows.fieldByName('displayname')
		});
		rows.next();
	}

	rows.close();
	db.close();

	return array;
}


function getPath() {
	var db   = Ti.Database.openFile(Ti.Filesystem.getFile(Ti.Filesystem.getApplicationDataDirectory(), 'database.db'));
	var rows = db.execute("SELECT * FROM container WHERE id = 1");
	while (rows.isValidRow()) {
		return rows.fieldByName('skypePath');
	}
	rows.close();
	db.close();
}

function insertDefaults(path) {
	var db = Ti.Database.openFile(Ti.Filesystem.getFile(Ti.Filesystem.getApplicationDataDirectory(), 'database.db'));
	db.execute("INSERT INTO container (id, skypePath) VALUES (1, '" + path + "')");
	alert('The path was saved successfully');
	db.close();
}

function leftChat(obj) {
	var html = '';

	html += '<li class="left clearfix" id="list-' + obj.id + '">';
	html += '   <div class="chat-img pull-left">';
	html += '       <button class="btn btn-danger btn-xs remove" type="submit" data-id="' + obj.id + '" style="margin:4px">';
	html += '           <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>';
	html += '       </button>';
	html += '   </div>';
	html += '   <div class="chat-body clearfix">';
	html += '       <div class="header">';
	html += '           <strong class="primary-font">' + obj.author + '</strong>';
	html += '           <small class="pull-right text-muted"><span class="glyphicon glyphicon-time"></span>&nbsp;' + obj.timestamp + '</small>';
	html += '       </div>';
	html += '       <p class="message">' + obj.body_xml + '</p>';
	html += '   </div>';
	html += '</li>';

	return html;
}

function rightChat(obj) {
	var html = '';

	html += '<li class="right clearfix" id="list-' + obj.id + '">';
	html += '   <div class="chat-img pull-right">';
	html += '       <button class="btn btn-danger btn-xs remove" type="submit" data-id="' + obj.id + '" style="margin:4px">';
	html += '           <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>';
	html += '       </button>';
	html += '   </div>';
	html += '   <div class="chat-body clearfix">';
	html += '       <div class="header">';
	html += '           <small class="text-muted"><span class="glyphicon glyphicon-time"></span>&nbsp;' + obj.timestamp + '</small>';
	html += '           <strong class="pull-right primary-font">' + obj.author + '</strong>';
	html += '       </div>';
	html += '       <p class="message">' + obj.body_xml + '</p>';
	html += '   </div>';
	html += '</li>';

	return html;
}