#Enable Map/Reduce of React SSR

Instead of rendering the entire site in a single thread, render connected components individually across processes and transclude the results back to a single string

The effectiveness of this approach depends on the ratio between the size of the props connected components require and the complexity of the VDOM they generate... benchmark in your app 