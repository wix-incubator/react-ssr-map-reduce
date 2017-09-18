const React = require('react');
const ReactDOM = require('react-dom');
const ReactDOMServer = require('react-dom/server');
const PropTypes = require('prop-types');

const ReactSSRMapReduce = require('../index');

function PureComponent({ text, children }) {
  return (
    <div>
      <h1>{text}</h1>
      {children}
    </div>
  );
}

class ConnectedComponent extends React.Component {
  render() {
    if (this.props.usePlaceHolders) {
      return React.createElement(`x-${this.props.id}`);
    }
    const item = this.context.store[this.props.id];
    const children = item.children.map(idx => (
      <ConnectedComponent id={idx} key={idx} usePlaceHolders={this.props.usePlaceHolders} />
    ));
    return <PureComponent text={item.text}>{children}</PureComponent>;
  }
}

ConnectedComponent.contextTypes = {
  store: PropTypes.object
};

class RootComponent extends React.Component {
  render() {
    return <ConnectedComponent id={'first'} usePlaceHolders={this.props.usePlaceHolders} />;
  }
  getChildContext() {
    return { store: this.props.store };
  }
}

RootComponent.childContextTypes = {
  store: PropTypes.object
};

function mapReduceRootComponent(store) {
  // render the root
  const rootString = ReactDOMServer.renderToString(<RootComponent usePlaceHolders={true} />);
  // render each connected component separately can be distributed
  const comps = Object.keys(store).reduce((acc, k) => {
    const item = store[k];
    const children = item.children.map(idx => <ConnectedComponent id={idx} key={idx} usePlaceHolders={true} />);
    acc[k] = ReactDOMServer.renderToString(<PureComponent text={item.text}>{children}</PureComponent>);
    return acc;
  }, {});

  const result = ReactSSRMapReduce(rootString, comps);
  return result;
}

describe('test map/reduce', () => {
  it('test reduce with same store', () => {
    // render the root
    const store = {
      first: { text: 'First', children: ['second'] },
      second: { text: 'Second', children: [] }
    };
    const result = mapReduceRootComponent(store);
    const container = document.createElement('div');
    container.innerHTML = result;
    const mountedInstance = container.firstChild;
    ReactDOM.render(<RootComponent usePlaceHolders={false} store={store} />, container);
    expect(mountedInstance).toEqual(container.firstChild);
  });
  it('test reduce changed store - expect the dom to be replaced', () => {
    // render the root
    const store = {
      first: { text: 'First', children: ['second'] },
      second: { text: 'Second', children: [] }
    };
    const result = mapReduceRootComponent(store);
    store.first.text = 'Modified';
    const container = document.createElement('div');
    container.innerHTML = result;
    const mountedInstance = container.firstChild;
    ReactDOM.render(<RootComponent usePlaceHolders={false} store={store} />, container);
    expect(mountedInstance).not.toEqual(container.firstChild);
  });
});
