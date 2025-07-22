export const getWelcomeEmailTemplate = (username: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenue sur Zukii</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8f9fa;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 20px;
          text-align: center;
          color: white;
        }
        .header h1 {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .header p {
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
        }
        .welcome-message {
          text-align: center;
          margin-bottom: 30px;
        }
        .welcome-message h2 {
          color: #2d3748;
          font-size: 24px;
          margin-bottom: 16px;
        }
        .welcome-message p {
          color: #4a5568;
          font-size: 16px;
          margin-bottom: 8px;
        }
        .features {
          margin: 30px 0;
        }
        .feature-item {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          padding: 16px;
          background-color: #f7fafc;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }
        .feature-icon {
          font-size: 24px;
          margin-right: 16px;
          width: 40px;
          text-align: center;
        }
        .feature-text {
          flex: 1;
        }
        .feature-text strong {
          color: #2d3748;
          display: block;
          margin-bottom: 4px;
        }
        .feature-text span {
          color: #4a5568;
          font-size: 14px;
        }
        .closing-message {
          text-align: center;
          margin: 40px 0 30px 0;
          padding: 30px;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          border-radius: 12px;
          color: white;
        }
        .closing-message h3 {
          margin-bottom: 12px;
          font-size: 20px;
        }
        .footer {
          background-color: #2d3748;
          color: #a0aec0;
          padding: 30px;
          text-align: center;
          font-size: 14px;
        }
        .footer strong {
          color: #ffffff;
        }
        .divider {
          height: 2px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          margin: 30px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>🚀 Zukii</h1>
          <p>Plateforme collaborative d'analyse de données</p>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="welcome-message">
            <h2>Bienvenue ${username} ! 👋</h2>
            <p>Nous sommes ravis de vous accueillir dans la communauté Zukii.</p>
            <p>Votre compte a été créé avec succès et vous pouvez maintenant commencer à analyser vos données !</p>
          </div>

          <div class="divider"></div>

          <div class="features">
            <div class="feature-item">
              <div class="feature-icon">📊</div>
              <div class="feature-text">
                <strong>Tableaux de bord collaboratifs</strong>
                <span>Créez et partagez vos analyses avec votre équipe</span>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">📁</div>
              <div class="feature-text">
                <strong>Import de fichiers CSV</strong>
                <span>Importez facilement vos données par glisser-déposer</span>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">🤖</div>
              <div class="feature-text">
                <strong>Analyse IA avancée</strong>
                <span>Posez des questions sur vos données et obtenez des insights</span>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">👥</div>
              <div class="feature-text">
                <strong>Collaboration en temps réel</strong>
                <span>Travaillez ensemble sur vos projets d'analyse</span>
              </div>
            </div>
          </div>

          <div class="closing-message">
            <h3>Prêt à commencer votre aventure analytique ? 🎯</h3>
            <p>Connectez-vous à votre espace Zukii et découvrez la puissance de l'analyse collaborative !</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p><strong>Zukii Team</strong></p>
          <p>Votre partenaire pour l'analyse collaborative de données</p>
          <p style="margin-top: 16px; font-size: 12px; opacity: 0.7;">
            Cet email a été envoyé automatiquement. Si vous avez des questions, n'hésitez pas à nous contacter.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};
