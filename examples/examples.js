document.querySelector('#debug').innerHTML = `
	<div id="apis">
		<button onclick="window.pManager.freeze()">Freeze</button>
		<button onclick="window.pManager.start()">Run</button>
	</div>
	<div id="version">Version: <span id="v">2.0.0</span></div>
`;
document.querySelector('#nav').innerHTML = `
	<a href="./">Default</a>
`;
