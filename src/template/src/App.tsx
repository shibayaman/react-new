import React from 'react';
import ReactDom from 'react-dom';

const App: React.FC = () => {
  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
};

ReactDom.render(<App />, document.getElementById('app'));
