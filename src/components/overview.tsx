import * as React from "react";
import { render } from "react-dom";
import * as data from "../data/user.json";
const users: any = data;

export default class MainContainer extends React.Component<any, any> {

	public render() {
		let buttons = [];

		for (let user of users) {
			console.log(user);
			buttons.push(<Button key={user.name} data={user} />);
		}

		console.log(buttons);
		return (
			<div className="container">
				<h1>All</h1>
				<div className="row">
					{buttons}
				</div>
			</div>
		);
	}
}

class Button extends React.Component<any, any> {
	constructor() {
		super();
	}

	public render() {
		return (
			<div className="col">
				<div className="tile">1. {this.props.data.name}</div>
			</div>
		);
	}
}
