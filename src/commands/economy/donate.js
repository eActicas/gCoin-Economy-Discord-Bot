const { specialArg, format } = require('../../utils/functions.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('donate')
		.setNameLocalizations({
			'pt-BR': 'doar',
			'es-ES': 'donar',
		})
		.setDescription('Donate x gCoins to a user')
		.setDescriptionLocalizations({
			'pt-BR': 'Doe x gCoins para outro usuário',
			'es-ES': 'Dona x gCoins a otro usuario',
		})
		.setDMPermission(false)
		.addUserOption((option) =>
			option
				.setName('user')
				.setNameLocalizations({
					'pt-BR': 'usuário',
					'es-ES': 'usuario',
				})
				.setDescription('User to donate to')
				.setDescriptionLocalizations({
					'pt-BR': 'Quem vai receber a doação',
					'es-ES': 'Quien va a recibir la donación',
				})
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName('gcoins')
				.setDescription('Amount of gCoins to donate')
				.setDescriptionLocalizations({
					'pt-BR': 'A quantidade de gCoins para doar',
					'es-ES': 'La cantidad de gCoins para donar',
				})
				.setRequired(true)
		),
	execute: async ({ interaction, user, instance, database }) => {
		await interaction.deferReply().catch(() => {});
		try {
			const gcoins = interaction.options.getString('gcoins');
			var target = interaction.options.getUser('user');
			const author = await database.player.findOne(user.id);
			const receiver = await database.player.findOne(target.id);
			try {
				var quantity = specialArg(gcoins, author.gcoins);
			} catch {
				await instance.editReply(interaction, {
					content: instance.getMessage(interaction, 'BAD_VALUE', {
						VALUE: gcoins,
					}),
				});
				return;
			}

			if (author.gcoins >= quantity) {
				author.gcoins -= quantity;
				receiver.gcoins += quantity;
				await instance.editReply(interaction, {
					content: instance.getMessage(interaction, 'DONATE', {
						GCOINS: format(quantity),
						USER: target,
					}),
				});
			} else {
				await instance.editReply(interaction, {
					content: instance.getMessage(interaction, 'NOT_ENOUGH_GCOINS'),
					ephemeral: true,
				});
			}
			author.save();
			receiver.save();
		} catch (error) {
			console.error(`donation: ${error}`);
			instance.editReply(interaction, {
				content: instance.getMessage(interaction, 'EXCEPTION'),
			});
		}
	},
};
