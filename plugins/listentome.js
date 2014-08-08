exports.init = function(SARAH){
	// Récupère les plugins activés depuis fichier json
	SARAH.context.listontome={};
	var fs = require('fs');
	var fileJSON = 'plugins/listentome/listentome.json';
	if (fs.existsSync(fileJSON)) {SARAH.context.listontome.pluginsactifs = JSON.parse(fs.readFileSync(fileJSON,'utf8'));}
}

exports.action = function(data, callback, config, SARAH) {

// MISE A JOUR DU XML AVEC LISTES DES PLUGINS A TRAITER
if ((data.action=="maj_plugins")) {
	console.log('plugin listentome : mise à jour des XML lazyLTM');
	var fs = require('fs');
    var fileXML = '';
	var plugins=[];
	var StrXmlContext="listentome.xml";
	var replace="";
	var pagecallback="";
	
	// Liste des plugins:
	if (data.plugins) {
		pagecallback+='<center>Mise à jour des XML lazyLTM:</br>';
		plugins=data.plugins.split(',');
		plugins.forEach(function (plugin) {
			// Créer le fichier lazzyLTMpluggin.xml
			var fileXML = 'plugins/'+plugin+'/'+plugin+'.xml';
			var xml = fs.readFileSync(fileXML, 'utf8');
			var regexp = new RegExp('<item>Sarah</item>', 'gi');
			var xml = xml.replace(regexp, "<item>  </item>");
			var fileXML = 'plugins/listentome/lazyLTM'+plugin+'.xml';
			fs.writeFileSync(fileXML, xml, 'utf8');
			console.log('création de '+fileXML);
			pagecallback+='création de '+fileXML+'</br>';

			// ajout du plugin dans le contexte
			StrXmlContext+=",";
			StrXmlContext+="lazyLTM"+plugin+".xml"
			
			});
	}	
	// Generation XML ListenToMe
    var fileXML = 'plugins/listentome/listentome.xml';
	var xml = fs.readFileSync(fileXML, 'utf8');
	replace = '##DEBUT'+ ' ZONE AUTOMATIQUE CONTEXT SARAH -->\n';
	replace+='            <tag>out.action._attributes.context = "'+ StrXmlContext + '";</tag>\n';
	replace += '		<!-- ##FIN';
	var regexp = new RegExp('##DEBUT[^*]+##FIN', 'gm');
	var xml = xml.replace(regexp, replace);
	fs.writeFileSync(fileXML, xml, 'utf8');
	console.log('context mis à jour dans listentome.xml: '+StrXmlContext);
	pagecallback+='</br></br>context mis à jour dans listentome.xml:</br> '+StrXmlContext+'</BR>';
	pagecallback+='</br></br>Opérations Terminée, vous pouvez fermer cette fenetre<center>';
	callback({'tts':pagecallback});

}

// Création de la page pour l'affichage des choix de plugins à activer
else if (data.action=="pagechoix") {
	reponse=compatibilite();
	pagestatus=reponse.pagestatus;
	SARAH.context.listontome.pluginscompatibles=reponse.pluginscompatibles;
	SARAH.context.listontome.pluginsactifs=reponse.pluginsactifs;
	var page="";
	page += '<center><form name="choixplugin" action="listentome" onsubmit="return valider()" method="get">';
	page += '<table border="1"> <CAPTION> Choisissez les pluggins SARAH à intégrer à ListenToMe:</CAPTION></br> ';
	page += '<input type="hidden"  name="action"  value="validerchoix">'
	Object.keys(SARAH.context.listontome.pluginscompatibles).forEach(function(plugin) { 
		if (SARAH.context.listontome.pluginscompatibles[plugin]==true) {
			if (SARAH.context.listontome.pluginsactifs[plugin]==true) 
				page += '<tr><td><INPUT type="checkbox" name="choix" value="'+plugin+'" checked> '+plugin+'</td><td>'+pagestatus[plugin]+'</td></tr>';
			else 
				page += '<tr><td><INPUT type="checkbox" name="choix" value="'+plugin+'" > '+plugin+'</td><td>'+pagestatus[plugin]+'</td></tr>';
		}
		else
			page += '<tr><td><INPUT type="checkbox" name="choix" value="'+plugin+'" disabled><font color=#999999>'+plugin+'</font></td><td><font color=#999999>'+pagestatus[plugin]+'</font></td></tr>';
//		console.log( plugin + ' ::: ' +SARAH.context.listontome.pluginscompatibles[plugin]);
	
	});		
	page += '</table></br><input type="submit" value="Valider"></form><center>';
	callback({'tts':page});
}

// MISE A JOUR DU XML AVEC LISTES DES PLUGINS A INTEGRER (retour de FORM)
else if (data.action=="validerchoix") {
	Object.keys(SARAH.context.listontome.pluginscompatibles).forEach(function(plugin) { 
		if ((data.choix)&&(data.choix.indexOf(plugin)>-1)) {
			console.log('plugin listentome : '+plugin + ' a été activé');
			SARAH.context.listontome.pluginsactifs[plugin]=true;
		}
		else
		{
			console.log('plugin listentome : '+plugin + ' a été désactivé');
			SARAH.context.listontome.pluginsactifs[plugin]=false;
		}
		
	});
	var fs = require('fs');
	var fileJSON = 'plugins/listentome/listentome.json';
	fs.writeFileSync(fileJSON, JSON.stringify(SARAH.context.listontome.pluginsactifs, null, 4) , 'utf8');
	
	// MODIFIE LES LazyLTMPLUGIN.XML activés: 
	var listeplugins=""
	Object.keys(SARAH.context.listontome.pluginsactifs).forEach(function(plugin) {
		if (SARAH.context.listontome.pluginsactifs[plugin]===true) {
			console.log('plugin ListenToMe : va créer lazzyLTM'+plugin+'.xml');
			if (listeplugins=="")
				listeplugins=plugin;
			else
				listeplugins+=","+plugin;
			}
	});
	SARAH.call('listentome', { 'action' : 'maj_plugins','plugins' : listeplugins} , function(options){callback(options);});
	
}

else {callback();}






// DETERMINE LES PLUGINS COMPATIBLES
	function compatibilite() {
		var fs = require('fs');
		var fileXML = '';
		var plugins={};
		var pluginscompatibles={};
		var pluginsactifs={};
		var pagestatus={};
		plugins=SARAH.ConfigManager.getConfig();
		console.log('plugin listentome:');
		Object.keys(plugins.modules).forEach(function(plugin) {
			if (plugin!='listentome') {
				//TEST DE CHAQUE PLUGIN
				var fileXML = 'plugins/'+plugin+'/'+plugin+'.xml';
				if (fs.existsSync(fileXML)) {
						xml = fs.readFileSync(fileXML, 'utf8');
						var regexp = new RegExp('<item>Sarah', 'gi');
						var match=xml.match(regexp);
						if (match !== null) {
							console.log('  - plugin '+plugin+' Compatible: '+match.length+ ' occurences "<item>Sarah" trouvées' );
							pagestatus[plugin]=' Compatible: '+match.length+ ' occurences "&lt;item&gt;Sarah" trouvées';
							pluginscompatibles[plugin]=true;
							if ((SARAH.context.listontome)&&(SARAH.context.listontome.pluginsactifs[plugin]===true)) 
								pluginsactifs[plugin]=true;
							else
								pluginsactifs[plugin]=false;
						} 
						else {
							console.log('X - plugin '+plugin+' Non Compatible: aucune occurence "<item>Sarah" trouvée');
							pagestatus[plugin]=' aucune occurence "&lt;item&gt;Sarah" trouvée';
							pluginscompatibles[plugin]=false;
							pluginsactifs[plugin]=false;
						}
				}
				else {
				console.log('X - plugin '+plugin+'  Non Compatible: XML inexistant ('+plugin+'.xml)');
				pagestatus[plugin]=' XML inexistant ('+plugin+'.xml)';
				pluginscompatibles[plugin]=false;
				pluginsactifs[plugin]=false;
				}
			}
		});
		listontome={};
		listontome.pagestatus=pagestatus;
		listontome.pluginscompatibles=pluginscompatibles;
		listontome.pluginsactifs=pluginsactifs;
		return listontome;
		}
}
