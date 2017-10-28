import * as React from "react";
import { render } from "react-dom";
import MainContainer from "./components/overview";

const BeermatApp = () => (
	<div>
		<div>Beermat</div>
		<MainContainer />
	</div>
);

render( <BeermatApp />, document.getElementById("root-app") );