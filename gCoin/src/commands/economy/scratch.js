const { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder } = require('discord.js');
const { format, randint, setCooldown } = require('../../utils/functions.js');

module.exports = {
	cooldown: 60 * 60 * 6,
	data: new SlashCommandBuilder()
		.setName('scratch')
		.setNameLocalizations({
			'pt-BR': 'raspadinha',
			'es-ES': 'raspadinha',
		})
		.setDescription('Play scratch-off for a chance to win a huge jackpot')
		.setDescriptionLocalizations({
			'pt-BR': 'Jogue raspadinha para uma chance de ganhar muitos gCoins',
			'es-ES': 'Juega raspadinha para una oportunidad de ganar muchos gCoins',
		})
		.setDMPermission(false),
	execute: async ({ interaction, instance, user, member, database }) => {
		try {
			await interaction.deferReply().catch(() => {});

			const player = await database.player.findOne(user.id);
			const row = new ActionRowBuilder();
			const row2 = new ActionRowBuilder();
			const row3 = new ActionRowBuilder();
			const row4 = new ActionRowBuilder();
			const row5 = new ActionRowBuilder();

			rows = [row, row2, row3, row4, row5];
			cr = 0;
			for (var i = 1; i < 26; i++) {
				if (i == 6 || i == 11 || i == 16 || i == 21) {
					++cr;
				}
				rows[cr].addComponents(new ButtonBuilder().setCustomId(String(i)).setStyle('Success').setEmoji('❓'));
			}

			var embed = instance.createEmbed(member.displayColor).addFields({
				name: instance.getMessage(interaction, 'SCRATCH_TITLE'),
				value: instance.getMessage(interaction, 'SCRATCH_DESCRIPTION'),
			});

			answer = await instance.editReply(interaction, {
				embeds: [embed],
				components: rows,
				fetchReply: true,
			});

			const filter = (btInt) => {
				return instance.defaultFilter(btInt) && btInt.user.id === user.id;
			};

			const collector = answer.createMessageComponentCollector({
				filter,
				max: 6,
				time: 1000 * 60 * 60 * 4,
			});

			collector.on('collect', async (i) => {
				const luck = randint(1, 100);
				cont = 6 - collector.total;
				var embed = instance.createEmbed();

				if (luck === 1) {
					//jackpot
					amount = randint(100000, 200000);
					player.gcoins += amount;
					player.stats.set('scratchJackpots', (player.stats.get('scratchJackpots') ?? 0) + 1);
					embed.setColor(15844367).addFields({
						name: instance.getMessage(interaction, 'SCRATCH_PRIZE'),
						value: `${instance.getMessage(interaction, 'SCRATCH_PRIZE_DESCRIPTION', {
							GCOINS: format(amount),
						})}`,
					});
					cont = 0;
					setCooldown(user.id, 'scratch', 60 * 60 * 12);
					collector.stop();
				} else if (2 <= luck <= 3) {
					//super close
					amount = randint(50000, 100000);
					player.gcoins += amount;
					embed.setColor(3066993).addFields({
						name: instance.getMessage(interaction, 'SCRATCH_SUPER'),
						value: `${instance.getMessage(interaction, 'SCRATCH_SUPER_DESCRIPTION', {
							GCOINS: format(amount),
						})}`,
					});
					cont = 0;
					setCooldown(user.id, 'scratch', 60 * 60 * 10);
					collector.stop();
				} else if (4 <= luck <= 8) {
					//pretty close
					amount = randint(20000, 50000);
					player.gcoins += amount;
					embed.setColor(3066993).addFields({
						name: instance.getMessage(interaction, 'SCRATCH_PRETTY'),
						value: `${instance.getMessage(interaction, 'SCRATCH_PRETTY_DESCRIPTION', {
							GCOINS: format(amount),
						})}`,
					});
					cont = 0;
					setCooldown(user.id, 'scratch', 60 * 60 * 8);
					collector.stop();
				} else if (9 <= luck <= 15) {
					//kinda close
					amount = randint(30000, 45000);
					player.gcoins += amount;
					embed.setColor(3066993).addFields({
						name: instance.getMessage(interaction, 'SCRATCH_KINDOF'),
						value: `${instance.getMessage(interaction, 'SCRATCH_KINDOF_DESCRIPTION', {
							GCOINS: format(amount),
							GUESSES: cont,
						})}`,
					});
				} else {
					//not found but still a chance to win some money
					embed.setColor(15158332);
					if (randint(1, 100) >= 85) {
						amount = randint(10000, 20000);
						player.gcoins += amount;
						embed.addFields({
							name: 'Meh...',
							value: `${instance.getMessage(interaction, 'SCRATCH_LOSE_DESCRIPTION2', {
								GCOINS: format(amount),
								GUESSES: cont,
							})}`,
						});
					} else {
						var lostMessages = instance.getMessage(interaction, 'SCRATCH_LOSE');
						embed.addFields({
							name: lostMessages[randint(0, 5)],
							value: `${instance.getMessage(interaction, 'SCRATCH_LOSE_DESCRIPTION', {
								GUESSES: cont,
							})}`,
						});
					}
				}

				if (cont != 0) {
					await i.update({
						embeds: [embed],
						components: rows,
					});
				} else {
					await i.update({
						embeds: [embed],
						components: [],
					});
				}
			});
			collector.on('end', () => player.save());
		} catch (error) {
			console.error(`scratch: ${error}`);
			instance.editReply(interaction, {
				content: instance.getMessage(interaction, 'EXCEPTION'),
				embeds: [],
				components: [],
			});
		}
	},
};
