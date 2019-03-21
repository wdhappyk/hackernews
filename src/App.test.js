import React from 'react';
import ReactDOM from 'react-dom';
import renderer from 'react-test-renderer';
import Enzyme, {shallow} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import App, {Search, Button, Table} from './App';
import sinon from 'sinon';
import {expect as expectChai} from 'chai';

Enzyme.configure({
	adapter: new Adapter()
})

describe('App', () => {
	it('renders without crashing', () => {
		const div = document.createElement('div');
		ReactDOM.render(<App/>, div);
		ReactDOM.unmountComponentAtNode(div);
	});

	test('there is a specific snapshot', () => {
		const component = renderer.create(<App/>);
		const tree = component.toJSON();

		expect(tree).toMatchSnapshot();
	});
});

describe('Search', () => {
	it('renders without crashing', () => {
		const div = document.createElement('div');
		ReactDOM.render(<Search onChange={() => {}}>Поиск</Search>, div);
		ReactDOM.unmountComponentAtNode(div);
	});

	test('there is a specific snapshot', () => {
		const component = renderer.create(<Search onChange={() => {}}>Поиск</Search>);
		const tree = component.toJSON();

		expect(tree).toMatchSnapshot();
	});
});

describe('Button', () => {
	it('renders without crashing', () => {
		const div = document.createElement('div');
		ReactDOM.render(<Button onClick={()=>{}}>Больше историй</Button>, div);
		ReactDOM.unmountComponentAtNode(div);
	});

	test('there is a specific snapshot', () => {
		const component = renderer.create(<Button onClick={()=>{}}>Больше историй</Button>);
		const tree = component.toJSON();

		expect(tree).toMatchSnapshot();
	});

	it('simulates click events', () => {
		const onClick = sinon.spy();
		const wrapper = shallow(<Button onClick={onClick}>Больше историй</Button>);
		wrapper.find('button').simulate('click');
		expectChai(onClick).to.have.property('callCount', 1);
	});
});

describe('Table', () => {
	const props = {
		list: [
			{title: '1', author: '1', num_comments: 1, points: 2, objectID: 'y'},
			{title: '2', author: '2', num_comments: 2, points: 2, objectID: 'z'}
		],
		onDismiss: () => {},
	};

	it('renders without crashing', () => {
		const div = document.createElement('div');
		ReactDOM.render(<Table {...props}>Больше историй</Table>, div);
		ReactDOM.unmountComponentAtNode(div);
	});

	test('there is a specific snapshot', () => {
		const component = renderer.create(<Table {...props}>Больше историй</Table>);
		const tree = component.toJSON();

		expect(tree).toMatchSnapshot();
	});

	it('show two items in list', () => {
		const element = shallow(<Table {...props}/>);

		expect(element.find('.table-row').length).toBe(2);
	});
});