const { randint } = require('../../utils/functions.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('8ball')
		.setNameLocalizations({
			'pt-BR': 'bola8',
			'es-ES': 'bola8',
		})
		.setDescription('Forecast your future')
		.setDescriptionLocalizations({
			'pt-BR': 'Preveja seu futuro',
			'es-ES': 'Prevea su futuro',
		})
		.setDMPermission(false)
		.addStringOption((option) =>
			option
				.setName('question')
				.setNameLocalizations({
					'pt-BR': 'pergunta',
					'es-ES': 'pregunta',
				})
				.setDescription('The question you want to ask the 8ball')
				.setDescriptionLocalizations({
					'pt-BR': 'A pergunta que a bola8 deve responder',
					'es-ES': 'La pregunta que la bola8 debe responder',
				})
				.setRequired(true)
		),
	execute: async ({ interaction, instance }) => {
		await interaction.deferReply().catch(() => {});
		try {
			const answers = instance.getMessage(interaction, '8BALL_ANSWERS');
			const answer = `${answers[randint(0, answers.length - 1)]}`;
			const embed = instance
				.createEmbed(2303786)
				.setAuthor({
					name: instance.getMessage(interaction, '8BALL'),
					iconURL: 'https://images.emojiterra.com/google/noto-emoji/unicode-13.1/128px/1f3b1.png',
				})
				.addFields(
					{
						name: instance.getMessage(interaction, 'QUESTION'),
						value: interaction.options.getString('question'),
					},
					{
						name: instance.getMessage(interaction, 'FORECAST'),
						value: answer,
					}
				);
			await instance.editReply(interaction, { embeds: [embed] });
		} catch (error) {
			console.error(`8ball: ${error}`);
			instance.editReply(interaction, {
				content: instance.getMessage(interaction, 'EXCEPTION'),
				embeds: [],
			});
		}
	},
};
