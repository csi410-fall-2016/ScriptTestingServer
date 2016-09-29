/* Query 18 */
/* Find departments that don’t offer courses. */


SELECT *
FROM Department
WHERE ddept NOT IN
    (SELECT cdept FROM Course);
