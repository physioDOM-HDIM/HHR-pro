<style>
	ul.messages {
		list-style-type: none;
		padding: 0px;
		height: 100%;
		overflow: auto;
		-webkit-overflow-scrolling: touch;
	}

	ul.messages > li {
		border-bottom: 1px solid black;
		padding: 5px 0px;
	}

	ul.messages > li:nth-child(odd) {
		background: #f9f9f9
	}

	div.detail {
		display: none;
	}

	.show {
		display: block;
	}

	li.message .title {
		font-weight: bold;
		text-overflow: ellipsis;
	}

	li.message div.status {
		width: 150px;
	}

	li.message div.severity {
		width: 150px;
	}

	li.message div.trow div.sendBy {
		width: 200px;
	}

	li.message div.trow div.sendDate {
		width: 100px;
	}

	li.message div.institution {
		text-overflow: ellipsis;
	}

	li.message div.content, div.comment {
		margin: 10px 0px;
	}

	li.message div.message {
		margin-left: 50px;
	}
</style>
<div class="main footer">
	<ul class="messages">
		<li class="message">
			<div class="ttable">
				<div class="trow">
					<div class="cell title">Message for the nursing office</div>
					<div class="cell status">Status : Transmitting</div>
					<div class="cell severity">Severity : Standard</div>
					<div class="cell" style="width:50px">
						<button class="btn btn-primary btn-xs" onclick="showDetail(this)">detail</button>
					</div>
				</div>
			</div>
			<div class="ttable">
				<div class="trow">
					<div class="cell sendDate" style="width:150px;">2014-03-24 14:26</div>
					<div class="cell sendBy" style="width:200px;">from : Deveaux C.</div>
					<div class="cell institution">Hopital de Nevers</div>
				</div>
			</div>
			<div class="detail">
				<div class="content">
					<div class="title">Content</div>
					<div class="message">Message to the Professionals of the Social Care<br/>
						Mrs Caledonie is losing weight since a few days.<br/>
						Could you check the good working of the scale and put a message on the TV.<br/>
						The Coordination<br/>
					</div>
				</div>
				<div class="comment">
					<div class="title">Comment</div>
					<div class="message">All is OK</div>
				</div>
			</div>
		</li>
	</ul>
</div>
<footer>
	<button class="btn btn-primary" onclick="showDlg('newMsg')">New message</button>
</footer>
<div class="dlg" id="newMsg" style="width: 700px;height: 600px;">
	<div class="content">
		<form class="form-horizontal" role="form" onsubmit="return false;">
			<div class="form-group">
				<div class="row">
					<div class="col-xs-6">
						<label for="inputEmail3" class="col-sm-3 control-label">Status</label>
						<div class="col-sm-9">
							<input type="text" class="form-control" id="inputEmail3" placeholder="Status">
						</div>
					</div>
					<div class="col-xs-6">
						<label for="inputPassword3" class="col-sm-3 control-label">Severity</label>
						<div class="col-sm-9">
							<input type="text" class="form-control" id="inputPassword3" placeholder="Severity">
						</div>
					</div>
				</div>
			</div>
			<div class="form-group">
				<label for="inputTitle" class="col-sm-2 control-label" style="text-align: left">Title</label>
				<div class="col-sm-10">
					<input type="text" class="form-control" id="inputTitle" placeholder="Title of the message">
				</div>
			</div>
			<div class="form-group">
				<label class="col-sm-3  control-label" style="text-align: left">Content</label>
			</div>
			<div class="form-group" style="margin: 0px 0px;">
				<div id="contentMsg" style="height: 150px;" contenteditable="true"></div>
			</div>
			<div class="form-group">
				<label class="col-sm-3  control-label" style="text-align: left">Comment</label>
			</div>
			<div class="form-group" style="margin: 0px 0px;">
				<div id="commentMsg" style="height: 100px;"  contenteditable="true"></div>
			</div>
		</form>
	</div>
	<footer>
		<button class="btn btn-danger" onclick="hideDlg('newMsg')">Cancel</button>
		<button class="btn btn-primary" onclick="hideDlg('newMsg')">Send</button>
	</footer>
</div>
</div>