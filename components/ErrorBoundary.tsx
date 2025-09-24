import React from 'react';

interface ErrorBoundaryState {
	err: Error | null;
	info: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
	public state: ErrorBoundaryState = { err: null, info: null };

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		return { err: error };
	}

	componentDidCatch(error: Error, info: React.ErrorInfo) {
		this.setState({ info });
		console.error('Unhandled error in UI:', error, info);
	}

	render() {
		if (this.state.err) {
			return (
				<div className="w-screen h-screen flex items-center justify-center bg-zinc-900 text-zinc-100 p-6">
					<div className="max-w-lg text-center">
						<h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
						<p className="text-zinc-400 mb-4">An unexpected error occurred. Please refresh the page to try again.</p>
						<pre className="text-xs text-left bg-zinc-800 border border-zinc-700 rounded p-3 overflow-auto max-h-48">
							{this.state.err.message}
						</pre>
					</div>
				</div>
			);
		}
		return this.props.children;
	}
}

export default ErrorBoundary;

