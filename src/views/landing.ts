import { html } from 'hono/html'

export const landingPage = () => {
	return html`
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>URL Shortener API</title>
				<link rel="icon" type="image/x-icon" href="/favicon.ico" />
				<style>
					* {
						margin: 0;
						padding: 0;
						box-sizing: border-box;
					}

					body {
						font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
							Cantarell, sans-serif;
						background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
						min-height: 100vh;
						display: flex;
						align-items: center;
						justify-content: center;
						padding: 20px;
					}

					.container {
						background: white;
						border-radius: 20px;
						padding: 60px 40px;
						max-width: 600px;
						width: 100%;
						box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
						text-align: center;
					}

					h1 {
						font-size: 3rem;
						color: #333;
						margin-bottom: 20px;
						font-weight: 700;
					}

					.subtitle {
						font-size: 1.25rem;
						color: #666;
						margin-bottom: 40px;
						line-height: 1.6;
					}

					.version {
						display: inline-block;
						background: #667eea;
						color: white;
						padding: 6px 16px;
						border-radius: 20px;
						font-size: 0.875rem;
						font-weight: 600;
						margin-bottom: 30px;
					}

					.btn {
						display: inline-block;
						background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
						color: white;
						padding: 16px 48px;
						border-radius: 50px;
						text-decoration: none;
						font-size: 1.125rem;
						font-weight: 600;
						transition: transform 0.2s, box-shadow 0.2s;
						box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
					}

					.btn:hover {
						transform: translateY(-2px);
						box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
					}

					.btn:active {
						transform: translateY(0);
					}

					.features {
						margin-top: 40px;
						display: grid;
						grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
						gap: 20px;
						text-align: left;
					}

					.feature {
						padding: 20px;
						background: #f8f9fa;
						border-radius: 12px;
					}

					.feature-title {
						font-weight: 600;
						color: #667eea;
						margin-bottom: 8px;
						font-size: 0.875rem;
					}

					.feature-desc {
						color: #666;
						font-size: 0.8rem;
						line-height: 1.4;
					}

					@media (max-width: 600px) {
						h1 {
							font-size: 2rem;
						}

						.subtitle {
							font-size: 1rem;
						}

						.container {
							padding: 40px 24px;
						}

						.features {
							grid-template-columns: 1fr;
						}
					}
				</style>
			</head>
			<body>
				<div class="container">
					<h1>URL Shortener</h1>
					<span class="version">v1.0.0</span>
					<p class="subtitle">
						Powerful REST API for shortening URLs with authentication and analytics
					</p>

					<a href="/api/docs" class="btn">View Documentation</a>

					<div class="features">
						<div class="feature">
							<div class="feature-title">Authentication</div>
							<div class="feature-desc">Secure JWT-based auth system</div>
						</div>
						<div class="feature">
							<div class="feature-title">Analytics</div>
							<div class="feature-desc">Track clicks and statistics</div>
						</div>
						<div class="feature">
							<div class="feature-title">OpenAPI</div>
							<div class="feature-desc">Full API documentation</div>
						</div>
					</div>
				</div>
			</body>
		</html>
	`
}
