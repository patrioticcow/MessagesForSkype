<?php

function fetch_data()
{
	global $document, $window;
	$document->getElementById("data")->innerHTML = "<span style=\"color:green\">Fetching...</span> ";

	$fn = function () {
		global $document, $window;
		mysql_connect("ensembldb.ensembl.org", "anonymous", "") or $window->alert(mysql_error());
		mysql_select_db("homo_sapiens_core_47_36i") or $window->alert(mysql_error());

		$result = mysql_query("select * from assembly LIMIT 0,5");
		$row = mysql_fetch_array($result);

		$asm_seq_region_id = $row["asm_seq_region_id"];

		$document->getElementById("data")->innerHTML = "asm_seq_region_id = $asm_seq_region_id";
	};

	$window->setTimeout($fn, 500);
}

?>